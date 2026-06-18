import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, '../../.env') });

const PROGRAM_ID = '69dc4b4680a3c5e4f8720cc2';

async function run() {
  const importPath = path.resolve(scriptDir, '../../../../client-migration/import-preview.json');
  if (!fs.existsSync(importPath)) {
    console.error('import-preview.json not found.');
    process.exit(1);
  }

  const clients: { email: string }[] = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
  const emails = clients.map(c => c.email.toLowerCase());
  console.log(`Loaded ${emails.length} emails from import-preview.json`);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not set in environment');

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected');

  const result = await User.updateMany(
    { email: { $in: emails } },
    { $set: { programId: PROGRAM_ID } }
  );

  await mongoose.disconnect();

  console.log(`Matched:  ${result.matchedCount}`);
  console.log(`Modified: ${result.modifiedCount}`);
}

run().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
