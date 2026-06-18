import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  OldClient,
  BenchmarkTemplate,
  MatchStatus,
  ResolvedMax,
  parseManualMappingsRtf,
  buildSubMaxLookup,
  parseMaxName,
  resolveMax,
} from './migrationUtils.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const migrationDir = path.resolve(scriptDir, '../../../../client-migration');

function statusIcon(status: MatchStatus): string {
  switch (status) {
    case 'matched':     return '✓';
    case 'manual':      return '✓ (manual)';
    case 'no-template':
    case 'no-rep-max':
    case 'non-weight':
    case 'empty':       return '— skip';
  }
}

function run() {
  const clientsPath = path.join(migrationDir, 'ClientsV2.json');
  const templatesPath = path.join(migrationDir, 'benchmarkTemplates.json');

  if (!fs.existsSync(templatesPath)) {
    console.error(`benchmarkTemplates.json not found at ${templatesPath}`);
    console.error('Run exportBenchmarkTemplates.ts first.');
    process.exit(1);
  }

  const rawClients: Record<string, OldClient> = JSON.parse(fs.readFileSync(clientsPath, 'utf-8'));
  const templates: BenchmarkTemplate[] = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));

  const manualMappingsPath = path.join(migrationDir, 'manual-mappings.rtf');
  let manualMappings = new Map<string, string>();
  if (fs.existsSync(manualMappingsPath)) {
    const rtfContent = fs.readFileSync(manualMappingsPath, 'utf-8');
    manualMappings = parseManualMappingsRtf(rtfContent);
    console.log(`Loaded ${manualMappings.size} manual mappings`);
  }

  const templatesByName = new Map<string, BenchmarkTemplate>();
  for (const t of templates) {
    templatesByName.set(t.name.toLowerCase(), t);
  }

  const subMaxById = buildSubMaxLookup(templates);
  const clients = Object.values(rawClients);

  const uniqueNames = new Set<string>();
  for (const client of clients) {
    for (const max of client.maxes) {
      uniqueNames.add(max.name);
    }
  }

  const uniqueResolutions = new Map<string, ResolvedMax>();
  for (const name of uniqueNames) {
    const parsed = parseMaxName(name);
    const resolved = resolveMax(parsed, templatesByName, manualMappings, subMaxById);
    uniqueResolutions.set(name, resolved);
  }

  const matched = [...uniqueResolutions.values()].filter((r) => r.status === 'matched' || r.status === 'manual');
  const skipped = [...uniqueResolutions.values()].filter(
    (r) => r.status !== 'matched' && r.status !== 'manual' && r.status !== 'empty'
  );

  const lines: string[] = [];

  lines.push('# Client Migration Conversion Preview');
  lines.push('');
  lines.push(`**Total clients:** ${clients.length}`);
  lines.push(`**Unique max names:** ${uniqueNames.size}`);
  lines.push(`**Matched:** ${matched.length} | **Skipped (not in new system):** ${skipped.length}`);
  lines.push('');

  lines.push('## Section 1 — Max Name Mapping');
  lines.push('');
  lines.push('| Old Max Name | Rep Count | Matched Template | Sub-Max Entry | Status |');
  lines.push('|---|---|---|---|---|');

  const sortedResolutions = [...uniqueResolutions.values()]
    .filter((r) => r.status !== 'empty')
    .sort((a, b) => a.originalName.localeCompare(b.originalName));

  for (const r of sortedResolutions) {
    const templateName = r.template ? r.template.name : '—';
    const subMaxName = r.subMaxName ?? '—';
    const reps = r.reps !== null ? String(r.reps) : '—';
    lines.push(`| ${r.originalName.trim()} | ${reps} | ${templateName} | ${subMaxName} | ${statusIcon(r.status)} |`);
  }
  lines.push('');

  lines.push('## Section 2 — Skipped Names (Not in New System)');
  lines.push('');
  if (skipped.length === 0) {
    lines.push('_All names matched successfully._');
  } else {
    lines.push('These old max names have no equivalent in the new system and will be skipped during import:');
    lines.push('');
    for (const r of skipped.sort((a, b) => a.originalName.localeCompare(b.originalName))) {
      lines.push(`- ${r.originalName.trim()}`);
    }
  }
  lines.push('');

  lines.push('## Section 3 — Per-Client Preview');
  lines.push('');

  for (const client of clients) {
    lines.push(`### ${client.firstName} ${client.lastName} (${client.email})`);
    lines.push('');
    lines.push('| Old Max Name | Weight (kg) | → Template | → Sub-Max | Status |');
    lines.push('|---|---|---|---|---|');

    for (const max of client.maxes) {
      if (!max.name.trim()) continue;
      const r = uniqueResolutions.get(max.name)!;
      const templateName = r.template ? r.template.name : '—';
      const subMaxName = r.subMaxName ?? '—';
      lines.push(`| ${max.name.trim()} | ${max.weight} | ${templateName} | ${subMaxName} | ${statusIcon(r.status)} |`);
    }
    lines.push('');
  }

  const outputPath = path.join(migrationDir, 'conversion-preview.md');
  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`Wrote conversion preview to ${outputPath}`);
  console.log(`  ${matched.length} unique names matched, ${skipped.length} skipped`);
}

run();
