import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGODB_PROD_URI!);
await client.connect();
console.log('Connected to prod MongoDB');

const db = client.db();
const user = await db.collection('users').findOne({
  firstName: /jenn/i,
  lastName: /morgan/i,
});

if (!user) {
  console.log('NOT FOUND: no user matching firstName ~ jenn, lastName ~ morgan');
  await client.close();
  process.exit(1);
}

console.log(`Found user: ${user.firstName} ${user.lastName} (${user._id})`);

type Check = {
  benchmarkSet: string;
  benchmarkName: string;
  arrayField: string;
  idField: string;
  index: number;
  value: unknown;
  isObjectId: boolean;
};

const checks: Check[] = [];

function isObjectId(value: unknown): boolean {
  return value instanceof ObjectId || (!!value && typeof value === 'object' && (value as any)._bsontype === 'ObjectId');
}

function checkBenchmarkSet(benchmarkSet: string, benchmarks: any[] | undefined) {
  if (!Array.isArray(benchmarks)) return;

  for (const benchmark of benchmarks) {
    const benchmarkName = benchmark?.name ?? '(unnamed)';

    const arrays: Array<[string, string]> = [
      ['repMaxes', 'templateRepMaxId'],
      ['timeSubMaxes', 'templateSubMaxId'],
      ['distanceSubMaxes', 'templateDistanceSubMaxId'],
    ];

    for (const [arrayField, idField] of arrays) {
      const entries = benchmark?.[arrayField];
      if (!Array.isArray(entries)) continue;

      entries.forEach((entry: any, index: number) => {
        const value = entry?.[idField];
        checks.push({
          benchmarkSet,
          benchmarkName,
          arrayField,
          idField,
          index,
          value,
          isObjectId: isObjectId(value),
        });
      });
    }
  }
}

checkBenchmarkSet('currentBenchmarks', user.currentBenchmarks);
checkBenchmarkSet('historicalBenchmarks', user.historicalBenchmarks);

console.log(`\nChecked ${checks.length} submax entries:\n`);

for (const c of checks) {
  const status = c.isObjectId ? 'OBJECTID (BUG)' : 'string (ok)';
  console.log(
    `[${c.benchmarkSet}] "${c.benchmarkName}" ${c.arrayField}[${c.index}].${c.idField} = ${typeof c.value} ${JSON.stringify(c.value)} -> ${status}`
  );
}

const bugCount = checks.filter((c) => c.isObjectId).length;

console.log(`\nSummary: ${checks.length} total, ${checks.length - bugCount} string (ok), ${bugCount} ObjectId (bug)`);

await client.close();
