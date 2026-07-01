import mongoose, { Types } from 'mongoose';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const OUTPUT   = '/Users/carterwilson/Repos/IronLogic4/packages/server/output';
const DELAY_MS = 300;

const preview: any[] = JSON.parse(readFileSync(`${OUTPUT}/missing-benchmarks-preview.json`, 'utf-8'));
const templates: any[] = JSON.parse(readFileSync(`${OUTPUT}/benchmark-templates.json`, 'utf-8'));
const templateById = new Map(templates.map(t => [t._id, t]));

await mongoose.connect(process.env.MONGODB_PROD_URI!);
console.log('Connected to MongoDB\n');

const db = mongoose.connection.db!;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let patched = 0, skipped = 0, failed = 0;

for (const user of preview) {
  process.stdout.write(`${user.email} ... `);

  const dbUser = await db.collection('users').findOne(
    { email: user.email.toLowerCase() },
    { projection: { _id: 1, currentBenchmarks: 1 } }
  );

  if (!dbUser) {
    console.log('SKIPPED (user not found in DB)');
    skipped++;
    await sleep(DELAY_MS);
    continue;
  }

  if (dbUser.currentBenchmarks?.length) {
    console.log('SKIPPED (already has benchmarks)');
    skipped++;
    await sleep(DELAY_MS);
    continue;
  }

  try {
    const now = new Date();

    const benchmarkDocs = user.benchmarks.map((b: any) => {
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

    await db.collection('users').updateOne(
      { _id: dbUser._id },
      { $push: { currentBenchmarks: { $each: benchmarkDocs } } as any }
    );

    console.log(`OK (benchmarks: ${benchmarkDocs.length})`);
    patched++;
  } catch (err: any) {
    console.log(`FAILED (${err.message})`);
    failed++;
  }

  await sleep(DELAY_MS);
}

await mongoose.disconnect();
console.log(`\nDone — patched: ${patched}, skipped: ${skipped}, failed: ${failed}`);
