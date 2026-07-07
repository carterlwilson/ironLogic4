import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_PROD_URI;
const GYM_ID    = '6912617d4d2e5e9cc486e33f';
const DELAY_MS  = 500;

const OUTPUT = '/Users/carterwilson/Repos/IronLogic4/packages/server/output';

if (!MONGO_URI) {
  console.error('MONGODB_PROD_URI is not set');
  process.exit(1);
}

const importUsers: any[] = JSON.parse(readFileSync(`${OUTPUT}/import-users.json`, 'utf-8'));
const templates: any[]   = JSON.parse(readFileSync(`${OUTPUT}/benchmark-templates.json`, 'utf-8'));
const templateById        = new Map(templates.map(t => [t._id, t]));

await mongoose.connect(MONGO_URI!);
console.log('Connected to MongoDB\n');

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const db = mongoose.connection.db!;
const hashedPassword = await bcrypt.hash('CullyStrength123', 12);
let created = 0, skipped = 0, failed = 0;

for (const user of importUsers) {
  process.stdout.write(`${user.email} ... `);

  // Skip if already exists
  const existing = await db.collection('users').findOne({ email: user.email.toLowerCase() });
  if (existing) {
    console.log('SKIPPED (already exists)');
    skipped++;
    await sleep(DELAY_MS);
    continue;
  }

  try {
    const now = new Date();

    // Build benchmark subdocuments
    const currentBenchmarks = (user.benchmarks ?? []).map((b: any) => {
      const template = templateById.get(b.templateId);
      const doc: any = {
        _id:        new Types.ObjectId(),
        templateId: b.templateId,
        name:       template?.name ?? b.templateId,
        type:       template?.type ?? 'weight',
        tags:       template?.tags ?? [],
        createdAt:  now,
        updatedAt:  now,
      };

      if (b.repMaxes) {
        doc.repMaxes = b.repMaxes.map((rm: any) => ({
          _id:              new Types.ObjectId(),
          templateRepMaxId: rm.templateRepMaxId,
          weightKg:         rm.weightKg,
          recordedAt:       now,
        }));
      }

      if (b.timeSubMaxes) {
        doc.timeSubMaxes = b.timeSubMaxes.map((sm: any) => ({
          _id:              new Types.ObjectId(),
          templateSubMaxId: sm.templateSubMaxId,
          distanceMeters:   sm.distanceMeters,
          recordedAt:       now,
        }));
      }

      return doc;
    });

    await db.collection('users').insertOne({
      _id:                new Types.ObjectId(),
      email:              user.email.toLowerCase().trim(),
      firstName:          user.firstName,
      lastName:           user.lastName,
      userType:           'client',
      gymId:              GYM_ID,
      password:           hashedPassword,
      ...(user.programId && { programId: user.programId }),
      currentBenchmarks,
      historicalBenchmarks: [],
      refreshTokens:        [],
      status:             'active',
      createdAt:          now,
      updatedAt:          now,
    });

    console.log(`OK (benchmarks: ${currentBenchmarks.length})`);
    created++;
  } catch (err: any) {
    console.log(`FAILED (${err.message})`);
    failed++;
  }

  await sleep(DELAY_MS);
}

await mongoose.disconnect();
console.log(`\nDone — created: ${created}, skipped: ${skipped}, failed: ${failed}`);
