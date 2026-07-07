import { readFileSync, writeFileSync } from 'fs';

const OUTPUT = '/Users/carterwilson/Repos/IronLogic4/packages/server/output';

const missingEmails: string[] = JSON.parse(readFileSync(`${OUTPUT}/missing-users.json`, 'utf-8'));
const oldUsers: any[] = JSON.parse(readFileSync(`${OUTPUT}/users-oldApp.json`, 'utf-8'));
const templates: any[] = JSON.parse(readFileSync(`${OUTPUT}/benchmark-templates.json`, 'utf-8'));

const missingSet = new Set(missingEmails.map(e => e.toLowerCase()));
const targetUsers = oldUsers.filter(u => u.email && missingSet.has(u.email.toLowerCase()));

// Template lookup by normalized name
const templateByName = new Map(templates.map(t => [t.name.toLowerCase().trim(), t]));

// Old exercise name → new template name
const exerciseAliases: Record<string, string> = {
  'incline press':       'incline bench press',
  'incline bench':       'incline bench press',
  'benchpress':          'bench press',
};

// Old distance machine name → template name
const distanceMachineMap: Record<string, string> = {
  'bike':    'bike - distance',
  'ski erg': 'ski - distance',
  'row':     'row - distance',
};

function parseMax(rawName: string): null | { type: 'weight'; reps: number; exercise: string } | { type: 'distance'; templateName: string; unit: 'km' | 'meters' } {
  const name = rawName.trim();

  // Skip known unmappable patterns
  if (/barbell row/i.test(name) || /thrusters/i.test(name)) return null;

  // Distance: "5 Min <Machine> (KM|Meters)"
  const distMatch = name.match(/^\d+ Min (.+?) \((KM|Meters)\)$/i);
  if (distMatch) {
    const machine = distMatch[1].trim().toLowerCase();
    const unit = distMatch[2].toLowerCase() === 'km' ? 'km' : 'meters';
    const templateName = distanceMachineMap[machine];
    if (!templateName) return null;
    return { type: 'distance', templateName, unit };
  }

  // Weight with RM prefix: "NRM <Exercise>"
  const rmMatch = name.match(/^(\d+)RM (.+)$/i);
  if (rmMatch) {
    return { type: 'weight', reps: parseInt(rmMatch[1]), exercise: rmMatch[2].trim() };
  }

  // Bare name → 1RM
  return { type: 'weight', reps: 1, exercise: name };
}

const importUsers = [];
const unmatched = new Set<string>();

for (const user of targetUsers) {
  // keyed by templateId
  const benchMap = new Map<string, { templateId: string; repMaxes?: Map<string, any>; timeSubMaxes?: Map<string, any> }>();

  for (const max of (user.maxes ?? [])) {
    const parsed = parseMax(max.name);
    if (!parsed) continue;

    if (parsed.type === 'weight') {
      const normalizedExercise = exerciseAliases[parsed.exercise.toLowerCase()] ?? parsed.exercise.toLowerCase().trim();
      const template = templateByName.get(normalizedExercise);
      if (!template) {
        unmatched.add(max.name);
        continue;
      }

      const repMax = template.templateRepMaxes?.find((rm: any) => rm.reps === parsed.reps);
      if (!repMax) {
        unmatched.add(max.name);
        continue;
      }

      if (!benchMap.has(template._id)) {
        benchMap.set(template._id, { templateId: template._id, repMaxes: new Map() });
      }
      const bench = benchMap.get(template._id)!;
      const existing = bench.repMaxes!.get(repMax._id);
      if (!existing || max.weight > existing.weightKg) {
        bench.repMaxes!.set(repMax._id, { templateRepMaxId: repMax._id, weightKg: max.weight });
      }

    } else {
      const template = templateByName.get(parsed.templateName);
      if (!template) { unmatched.add(max.name); continue; }

      const subMax = template.templateTimeSubMaxes?.[0];
      if (!subMax) { unmatched.add(max.name); continue; }

      const distanceMeters = parsed.unit === 'km' ? max.weight * 1000 : max.weight;

      if (!benchMap.has(template._id)) {
        benchMap.set(template._id, { templateId: template._id, timeSubMaxes: new Map() });
      }
      const bench = benchMap.get(template._id)!;
      if (!bench.timeSubMaxes) bench.timeSubMaxes = new Map();
      const existing = bench.timeSubMaxes.get(subMax._id);
      if (!existing || distanceMeters > existing.distanceMeters) {
        bench.timeSubMaxes.set(subMax._id, { templateSubMaxId: subMax._id, distanceMeters });
      }
    }
  }

  const benchmarks = [...benchMap.values()].map(b => {
    const entry: any = { templateId: b.templateId };
    if (b.repMaxes?.size)     entry.repMaxes     = [...b.repMaxes.values()];
    if (b.timeSubMaxes?.size) entry.timeSubMaxes  = [...b.timeSubMaxes.values()];
    return entry;
  });

  importUsers.push({
    firstName:  user.firstName  ?? '',
    lastName:   user.lastName   ?? '',
    email:      user.email,
    benchmarks,
  });
}

writeFileSync(`${OUTPUT}/import-users.json`, JSON.stringify(importUsers, null, 2));
console.log(`Written ${importUsers.length} users to import-users.json`);

if (unmatched.size) {
  console.log(`\nUnmatched max names (skipped):`);
  [...unmatched].sort().forEach(n => console.log(`  - ${n}`));
}
