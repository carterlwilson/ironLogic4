import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGODB_PROD_URI!);
await client.connect();
console.log('Connected to prod MongoDB');

const db = client.db();
const before = await db.collection('users').findOne({ email: 'mattfinlayson@gmail.com' });

if (!before) {
  console.log('NOT FOUND');
  await client.close();
  process.exit(1);
}

console.log('Current gymId type:', typeof before.gymId, before.gymId);

// $set touches ONLY gymId — same value, correct type (string, matching the schema
// and every other user's stored gymId), nothing else on the document changes.
await db.collection('users').updateOne(
  { _id: before._id },
  { $set: { gymId: before.gymId.toString() } }
);

const after = await db.collection('users').findOne({ email: 'mattfinlayson@gmail.com' });

const beforeRest = { ...before, gymId: undefined };
const afterRest = { ...after, gymId: undefined };
const same = JSON.stringify(beforeRest) === JSON.stringify(afterRest);

console.log('New gymId type:', typeof after!.gymId, after!.gymId);
console.log('Every other field identical:', same);

if (!same) {
  console.log('WARNING: non-gymId fields differ!');
  console.log('before:', JSON.stringify(beforeRest, null, 2));
  console.log('after:', JSON.stringify(afterRest, null, 2));
}

await client.close();
