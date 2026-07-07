import mongoose from 'mongoose';
import { readFileSync, writeFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const OUTPUT = '/Users/carterwilson/Repos/IronLogic4/packages/server/output';

const newAppEmails: string[] = JSON.parse(readFileSync(`${OUTPUT}/users-newApp.json`, 'utf-8'));
const oldUsers: any[]        = JSON.parse(readFileSync(`${OUTPUT}/users-oldApp.json`, 'utf-8'));
const templates: any[]       = JSON.parse(readFileSync(`${OUTPUT}/benchmark-templates.json`, 'utf-8'));

const oldByEmail   = new Map(oldUsers.map((u: any) => [u.email?.toLowerCase(), u]));
const templateByName = new Map(templates.map(t => [t.name.toLowerCase().trim(), t]));
const templateById   = new Map(templates.map(t => [t._id, t]));

const exerciseAliases: Record<string, string> = {
  'incline press': 'incline bench press',
  'incline bench': 'incline bench press',
  'benchpress':   'bench press',
};

const distanceMachineMap: Record<string, string> = {
  'bike':    'bike - distance',
  'ski erg': 'ski - distance',
  'row':     'row - distance',
};

function parseMax(rawName: string) {
  const name = rawName.trim();
  if (/barbell row/i.test(name) || /thrusters/i.test(name)) return null;

  const distMatch = name.match(/^\d+ Min (.+?) \((KM|Meters)\)$/i);
  if (distMatch) {
    const machine = distMatch[1].trim().toLowerCase();
    const unit = distMatch[2].toLowerCase() === 'km' ? 'km' : 'meters';
    const templateName = distanceMachineMap[machine];
    if (!templateName) return null;
    return { type: 'distance' as const, templateName, unit: unit as 'km' | 'meters' };
  }

  const rmMatch = name.match(/^(\d+)RM (.+)$/i);
  if (rmMatch) return { type: 'weight' as const, reps: parseInt(rmMatch[1]), exercise: rmMatch[2].trim() };

  return { type: 'weight' as const, reps: 1, exercise: name };
}

function buildBenchmarks(maxes: any[]) {
  const benchMap = new Map<string, any>();

  for (const max of maxes) {
    if (!max.name || max.weight === undefined) continue;
    const parsed = parseMax(max.name);
    if (!parsed) continue;

    if (parsed.type === 'weight') {
      const normalizedExercise = exerciseAliases[parsed.exercise.toLowerCase()] ?? parsed.exercise.toLowerCase().trim();
      const template = templateByName.get(normalizedExercise);
      if (!template) continue;

      const repMax = template.templateRepMaxes?.find((rm: any) => rm.reps === parsed.reps);
      if (!repMax) continue;

      if (!benchMap.has(template._id)) benchMap.set(template._id, { templateId: template._id, templateName: template.name, repMaxes: new Map() });
      const bench = benchMap.get(template._id);
      const existing = bench.repMaxes.get(repMax._id);
      if (!existing || max.weight > existing.weightKg) {
        bench.repMaxes.set(repMax._id, { templateRepMaxId: repMax._id, repMaxName: repMax.name, weightKg: max.weight });
      }

    } else {
      const template = templateByName.get(parsed.templateName);
      if (!template) continue;
      const subMax = template.templateTimeSubMaxes?.[0];
      if (!subMax) continue;

      const distanceMeters = parsed.unit === 'km' ? max.weight * 1000 : max.weight;
      if (!benchMap.has(template._id)) benchMap.set(template._id, { templateId: template._id, templateName: template.name, timeSubMaxes: new Map() });
      const bench = benchMap.get(template._id);
      if (!bench.timeSubMaxes) bench.timeSubMaxes = new Map();
      const existing = bench.timeSubMaxes.get(subMax._id);
      if (!existing || distanceMeters > existing.distanceMeters) {
        bench.timeSubMaxes.set(subMax._id, { templateSubMaxId: subMax._id, distanceMeters });
      }
    }
  }

  return [...benchMap.values()].map(b => {
    const entry: any = { templateId: b.templateId, templateName: b.templateName };
    if (b.repMaxes?.size)     entry.repMaxes     = [...b.repMaxes.values()];
    if (b.timeSubMaxes?.size) entry.timeSubMaxes  = [...b.timeSubMaxes.values()];
    return entry;
  });
}

await mongoose.connect(process.env.MONGODB_PROD_URI!);
const db = mongoose.connection.db!;

const dbUsers = await db.collection('users')
  .find({ email: { $in: newAppEmails.map(e => e.toLowerCase()) } })
  .project({ email: 1, firstName: 1, lastName: 1, currentBenchmarks: 1 })
  .toArray();

await mongoose.disconnect();

const noBenchmarks = dbUsers.filter(u => !u.currentBenchmarks?.length);

const preview = noBenchmarks
  .map(u => {
    const old = oldByEmail.get(u.email.toLowerCase());
    if (!old?.maxes?.length) return null;
    const benchmarks = buildBenchmarks(old.maxes);
    if (!benchmarks.length) return null;
    return { email: u.email, firstName: u.firstName, lastName: u.lastName, benchmarks };
  })
  .filter(Boolean);

writeFileSync(`${OUTPUT}/missing-benchmarks-preview.json`, JSON.stringify(preview, null, 2));
console.log(`Preview written: ${preview.length} users, output/missing-benchmarks-preview.json`);
