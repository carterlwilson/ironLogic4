import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, '../../.env') });

const DEFAULT_PASSWORD = 'CullyStrength123';
const SALT_ROUNDS = 12;

async function run() {
  const importPath = path.resolve(scriptDir, '../../../../client-migration/import-preview.json');
  if (!fs.existsSync(importPath)) {
    console.error('import-preview.json not found. Run migration:import-requests first.');
    process.exit(1);
  }

  const clients = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
  console.log(`Loaded ${clients.length} clients from import-preview.json`);

  // Guard against duplicate emails within the import list itself
  const emailsSeen = new Set<string>();
  const dupeEmails: string[] = [];
  for (const c of clients) {
    const key = c.email.toLowerCase();
    if (emailsSeen.has(key)) dupeEmails.push(c.email);
    else emailsSeen.add(key);
  }
  if (dupeEmails.length > 0) {
    console.error(`Duplicate emails within import list — fix before proceeding:`);
    dupeEmails.forEach(e => console.error(`  ${e}`));
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not set in environment');

  console.log('Hashing default password...');
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected');

  const docs = clients.map((c: any) => ({ ...c, password: hashedPassword }));

  // insertMany with ordered:false continues past individual failures
  let inserted = 0;
  const failures: { email: string; reason: string }[] = [];

  const result = await User.insertMany(docs, { ordered: false }).catch((err: any) => {
    // Bulk write errors still return a result with the successful inserts
    if (err.name === 'MongoBulkWriteError') return err;
    throw err;
  });

  if (result && result.insertedCount !== undefined) {
    inserted = result.insertedCount;
  } else if (result && result.result) {
    inserted = result.result.insertedCount ?? 0;
  } else {
    inserted = docs.length;
  }

  if (result.writeErrors) {
    for (const e of result.writeErrors) {
      const doc = docs[e.index];
      failures.push({ email: doc?.email ?? `index ${e.index}`, reason: e.errmsg ?? String(e) });
    }
  }

  await mongoose.disconnect();

  console.log('');
  console.log(`Inserted:  ${inserted}`);
  console.log(`Failed:    ${failures.length}`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  ${f.email}: ${f.reason}`);
  }
  console.log('\nDone. All clients can log in with password: CullyStrength123');
}

run().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
