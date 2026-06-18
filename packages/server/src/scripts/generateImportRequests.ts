import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  OldClient,
  BenchmarkTemplate,
  parseManualMappingsRtf,
  buildSubMaxLookup,
  parseMaxName,
  resolveMax,
} from './migrationUtils.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const migrationDir = path.resolve(scriptDir, '../../../../client-migration');

interface ExistingUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
}

interface RepMaxEntry {
  templateRepMaxId: string;
  weightKg: number;
  recordedAt: string;
}

interface TimeSubMaxEntry {
  templateSubMaxId: string;
  distanceMeters: number;
  recordedAt: string;
}

interface ClientBenchmark {
  templateId: string;
  name: string;
  type: string;
  tags: string[];
  repMaxes?: RepMaxEntry[];
  timeSubMaxes?: TimeSubMaxEntry[];
}

interface ImportClient {
  email: string;
  firstName: string;
  lastName: string;
  userType: 'client';
  gymId: string;
  status: 'active';
  currentBenchmarks: ClientBenchmark[];
  historicalBenchmarks: [];
  refreshTokens: [];
}

function fullName(firstName: string, lastName: string): string {
  return `${firstName.trim().toLowerCase()} ${lastName.trim().toLowerCase()}`;
}

function buildBenchmarks(
  client: OldClient,
  templates: BenchmarkTemplate[],
  uniqueResolutions: Map<string, ReturnType<typeof resolveMax>>
): ClientBenchmark[] {
  const now = new Date().toISOString();

  // Collect matched entries grouped by templateId
  const grouped = new Map<string, { template: BenchmarkTemplate; entries: { subMaxId: string; subMaxType: string; weight: number }[] }>();

  for (const max of client.maxes) {
    if (!max.name.trim()) continue;
    const r = uniqueResolutions.get(max.name)!;
    if (r.status !== 'matched' && r.status !== 'manual') continue;

    const templateId = r.template!._id;
    if (!grouped.has(templateId)) {
      grouped.set(templateId, { template: r.template!, entries: [] });
    }
    grouped.get(templateId)!.entries.push({
      subMaxId: r.subMaxId!,
      subMaxType: r.subMaxType!,
      weight: max.weight,
    });
  }

  const benchmarks: ClientBenchmark[] = [];

  for (const [templateId, { template, entries }] of grouped) {
    if (template.type === 'weight') {
      // Dedup by subMaxId — keep highest weight
      const best = new Map<string, number>();
      for (const e of entries) {
        const current = best.get(e.subMaxId) ?? -Infinity;
        if (e.weight > current) best.set(e.subMaxId, e.weight);
      }

      benchmarks.push({
        templateId,
        name: template.name,
        type: 'weight',
        tags: [],
        repMaxes: [...best.entries()].map(([templateRepMaxId, weightKg]) => ({
          templateRepMaxId,
          weightKg,
          recordedAt: now,
        })),
      });
    } else if (template.type === 'distance') {
      // Dedup by subMaxId — keep highest distance
      const best = new Map<string, number>();
      for (const e of entries) {
        const distanceMeters = template.distanceUnit === 'kilometers' ? e.weight * 1000 : e.weight;
        const current = best.get(e.subMaxId) ?? -Infinity;
        if (distanceMeters > current) best.set(e.subMaxId, distanceMeters);
      }

      benchmarks.push({
        templateId,
        name: template.name,
        type: 'distance',
        tags: [],
        timeSubMaxes: [...best.entries()].map(([templateSubMaxId, distanceMeters]) => ({
          templateSubMaxId,
          distanceMeters,
          recordedAt: now,
        })),
      });
    }
  }

  return benchmarks;
}

function run() {
  const clientsPath = path.join(migrationDir, 'ClientsV2.json');
  const templatesPath = path.join(migrationDir, 'benchmarkTemplates.json');
  const usersPath = path.join(migrationDir, 'users.json');

  for (const [label, p] of [['ClientsV2.json', clientsPath], ['benchmarkTemplates.json', templatesPath], ['users.json', usersPath]] as const) {
    if (!fs.existsSync(p)) {
      console.error(`${label} not found. Run the relevant export script first.`);
      process.exit(1);
    }
  }

  const rawClients: Record<string, OldClient> = JSON.parse(fs.readFileSync(clientsPath, 'utf-8'));
  const templates: BenchmarkTemplate[] = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));
  const existingUsers: ExistingUser[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

  const manualMappingsPath = path.join(migrationDir, 'manual-mappings.rtf');
  let manualMappings = new Map<string, string>();
  if (fs.existsSync(manualMappingsPath)) {
    const rtfContent = fs.readFileSync(manualMappingsPath, 'utf-8');
    manualMappings = parseManualMappingsRtf(rtfContent);
  }

  const templatesByName = new Map<string, BenchmarkTemplate>();
  for (const t of templates) templatesByName.set(t.name.toLowerCase(), t);

  const subMaxById = buildSubMaxLookup(templates);
  const gymId = templates[0]?.gymId as string | undefined;
  if (!gymId) {
    console.error('Could not derive gymId from benchmarkTemplates.json');
    process.exit(1);
  }

  // Pre-resolve all unique max names
  const clients = Object.values(rawClients);
  const uniqueNames = new Set<string>();
  for (const client of clients) {
    for (const max of client.maxes) uniqueNames.add(max.name);
  }
  const uniqueResolutions = new Map<string, ReturnType<typeof resolveMax>>();
  for (const name of uniqueNames) {
    uniqueResolutions.set(name, resolveMax(parseMaxName(name), templatesByName, manualMappings, subMaxById));
  }

  // Build duplicate lookups by full name AND by email
  const existingByName = new Map<string, ExistingUser>();
  const existingByEmail = new Map<string, ExistingUser>();
  for (const u of existingUsers) {
    existingByName.set(fullName(u.firstName, u.lastName), u);
    existingByEmail.set(u.email.toLowerCase(), u);
  }

  const importList: ImportClient[] = [];
  const duplicates: { oldClient: OldClient; matchedUser: ExistingUser; matchedOn: string }[] = [];

  for (const client of clients) {
    const nameMatch = existingByName.get(fullName(client.firstName, client.lastName));
    const emailMatch = existingByEmail.get(client.email.toLowerCase());
    const match = nameMatch ?? emailMatch;
    const matchedOn = nameMatch ? 'name' : emailMatch ? 'email' : null;

    if (match && matchedOn) {
      duplicates.push({ oldClient: client, matchedUser: match, matchedOn });
    } else {
      importList.push({
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        userType: 'client',
        gymId,
        status: 'active',
        currentBenchmarks: buildBenchmarks(client, templates, uniqueResolutions),
        historicalBenchmarks: [],
        refreshTokens: [],
      });
    }
  }

  // Deduplicate import list by email (same email appearing twice in old data — keep first)
  const seenEmails = new Set<string>();
  const dedupedImportList = importList.filter(c => {
    const key = c.email.toLowerCase();
    if (seenEmails.has(key)) return false;
    seenEmails.add(key);
    return true;
  });
  if (dedupedImportList.length < importList.length) {
    console.log(`Removed ${importList.length - dedupedImportList.length} intra-list email duplicate(s)`);
  }

  // Write import-preview.json
  const importPath = path.join(migrationDir, 'import-preview.json');
  fs.writeFileSync(importPath, JSON.stringify(dedupedImportList, null, 2));

  // Write duplicateNames.md
  const dupLines: string[] = [];
  dupLines.push('# Duplicate Clients (Skipped from Import)');
  dupLines.push('');
  dupLines.push(`${duplicates.length} old clients were skipped because a user with the same full name already exists in the new app.`);
  dupLines.push('');
  dupLines.push('| Old Client Name | Old Email | Matched New-App User | New-App Email | New-App Role | Matched On |');
  dupLines.push('|---|---|---|---|---|---|');
  for (const { oldClient, matchedUser, matchedOn } of duplicates) {
    const oldName = `${oldClient.firstName} ${oldClient.lastName}`;
    const newName = `${matchedUser.firstName} ${matchedUser.lastName}`;
    dupLines.push(`| ${oldName} | ${oldClient.email} | ${newName} | ${matchedUser.email} | ${matchedUser.userType} | ${matchedOn} |`);
  }
  const dupPath = path.join(migrationDir, 'duplicateNames.md');
  fs.writeFileSync(dupPath, dupLines.join('\n'));

  console.log(`Total old clients:   ${clients.length}`);
  console.log(`Duplicates skipped:  ${duplicates.length}`);
  console.log(`Ready to import:     ${dedupedImportList.length}`);
  console.log(`Wrote: ${importPath}`);
  console.log(`Wrote: ${dupPath}`);
}

run();
