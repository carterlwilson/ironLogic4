import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGODB_PROD_URI!);
await client.connect();
console.log('Connected to prod MongoDB');

const db = client.db();
const clients = await db.collection('users').find({ userType: 'client' }).toArray();

console.log(`Scanning ${clients.length} clients for duplicate currentBenchmarks templateIds...\n`);

function summarizeEntry(benchmark: any): string {
  const parts: string[] = [];
  if (Array.isArray(benchmark.repMaxes) && benchmark.repMaxes.length > 0) {
    parts.push(`repMaxes(${benchmark.repMaxes.length}): [${benchmark.repMaxes.map((rm: any) => `${rm.weightKg}kg`).join(', ')}]`);
  }
  if (Array.isArray(benchmark.timeSubMaxes) && benchmark.timeSubMaxes.length > 0) {
    parts.push(`timeSubMaxes(${benchmark.timeSubMaxes.length}): [${benchmark.timeSubMaxes.map((tm: any) => `${tm.distanceMeters}m`).join(', ')}]`);
  }
  if (Array.isArray(benchmark.distanceSubMaxes) && benchmark.distanceSubMaxes.length > 0) {
    parts.push(`distanceSubMaxes(${benchmark.distanceSubMaxes.length}): [${benchmark.distanceSubMaxes.map((dm: any) => `${dm.timeSeconds}s`).join(', ')}]`);
  }
  if (benchmark.timeSeconds !== undefined) parts.push(`timeSeconds=${benchmark.timeSeconds}`);
  if (benchmark.reps !== undefined) parts.push(`reps=${benchmark.reps}`);
  return parts.length > 0 ? parts.join(', ') : '(empty)';
}

let affectedClientCount = 0;
let totalDuplicateGroups = 0;

for (const clientUser of clients) {
  const currentBenchmarks = clientUser.currentBenchmarks;
  if (!Array.isArray(currentBenchmarks) || currentBenchmarks.length === 0) continue;

  const byTemplateId = new Map<string, any[]>();
  for (const benchmark of currentBenchmarks) {
    const tid = benchmark.templateId;
    if (!byTemplateId.has(tid)) byTemplateId.set(tid, []);
    byTemplateId.get(tid)!.push(benchmark);
  }

  const duplicateGroups = [...byTemplateId.entries()].filter(([, entries]) => entries.length > 1);
  if (duplicateGroups.length === 0) continue;

  affectedClientCount++;
  totalDuplicateGroups += duplicateGroups.length;

  console.log(`--- ${clientUser.firstName} ${clientUser.lastName} <${clientUser.email}> (_id: ${clientUser._id}) ---`);
  for (const [templateId, entries] of duplicateGroups) {
    console.log(`  Duplicated templateId ${templateId} ("${entries[0].name}") — ${entries.length} entries:`);
    entries.forEach((entry, i) => {
      console.log(`    [${i}] _id=${entry._id} ${summarizeEntry(entry)}`);
    });
  }
  console.log('');
}

console.log(`Summary: ${clients.length} clients scanned, ${affectedClientCount} affected, ${totalDuplicateGroups} duplicate templateId groups found`);

await client.close();
