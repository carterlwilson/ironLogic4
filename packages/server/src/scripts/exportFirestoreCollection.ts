import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Exports an entire Firestore collection to a local JSON file.
 *
 * Usage:
 *   tsx src/scripts/exportFirestoreCollection.ts <collection> [outputFile]
 *
 * Environment variables:
 *   GOOGLE_APPLICATION_CREDENTIALS  Path to Firebase service account JSON (required)
 *   FIREBASE_PROJECT_ID             Firebase project ID (required if not in service account file)
 */

const [collection, outputArg] = process.argv.slice(2);

if (!collection) {
  console.error('Usage: tsx src/scripts/exportFirestoreCollection.ts <collection> [outputFile]');
  process.exit(1);
}

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(credentialsPath), 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

console.log(`Fetching all documents from collection "${collection}"...`);

const snapshot = await db.collection(collection).get();

if (snapshot.empty) {
  console.log('Collection is empty — nothing to export.');
  process.exit(0);
}

const docs = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

console.log(`Fetched ${docs.length} document(s).`);

const outputPath = resolve(outputArg ?? `${collection}-export.json`);
writeFileSync(outputPath, JSON.stringify(docs, null, 2), 'utf-8');

console.log(`Wrote export to ${outputPath}`);
