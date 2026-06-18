export interface OldMax {
  name: string;
  weight: number;
}

export interface OldClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  scheduleId: string;
  maxes: OldMax[];
}

export interface TemplateRepMax {
  _id: string;
  reps: number;
  name: string;
}

export interface TemplateSubMax {
  _id: string;
  name: string;
}

export interface BenchmarkTemplate {
  _id: string;
  name: string;
  type: string;
  gymId?: string;
  distanceUnit?: 'meters' | 'kilometers';
  templateRepMaxes?: TemplateRepMax[];
  templateTimeSubMaxes?: TemplateSubMax[];
  templateDistanceSubMaxes?: TemplateSubMax[];
}

export interface ParsedMax {
  originalName: string;
  weight: number;
  reps: number | null;
  exerciseName: string | null;
  category: 'weight' | 'other';
}

export type MatchStatus = 'matched' | 'manual' | 'no-template' | 'no-rep-max' | 'non-weight' | 'empty';

export interface ResolvedMax extends ParsedMax {
  template: BenchmarkTemplate | null;
  subMaxName: string | null;
  subMaxId: string | null;
  subMaxType: 'repMax' | 'timeSubMax' | 'distanceSubMax' | null;
  status: MatchStatus;
}

export interface SubMaxInfo {
  template: BenchmarkTemplate;
  subMaxName: string;
  subMaxType: 'repMax' | 'timeSubMax' | 'distanceSubMax';
}

const RM_REGEX = /^(\d+)RM\s+(.+)$/i;

export function parseManualMappingsRtf(rtfContent: string): Map<string, string> {
  const mappings = new Map<string, string>();

  const normalized = rtfContent
    .replace(/\\'93/g, '\x01')
    .replace(/\\'94/g, '\x02')
    .replace(/\\\'[0-9a-f]{2}/gi, '')
    .replace(/\\[a-z*]+[-]?\d*\s*/gi, '')
    .replace(/[{}]/g, '');

  const segments: { pos: number; end: number; type: 'name' | 'id'; value: string }[] = [];

  const rtfQuoteRegex = /\x01([^\x01\x02]+)\x02/g;
  let m: RegExpExecArray | null;
  while ((m = rtfQuoteRegex.exec(normalized)) !== null) {
    const value = m[1].replace(/^["]+|["]+$/g, '').trim();
    if (!value) continue;
    if (/^[0-9a-f]{24}$/i.test(value)) {
      segments.push({ pos: m.index, end: m.index + m[0].length, type: 'id', value });
    } else {
      segments.push({ pos: m.index, end: m.index + m[0].length, type: 'name', value });
    }
  }

  const bareHexRegex = /[^0-9a-f]([0-9a-f]{24})[^0-9a-f]/gi;
  while ((m = bareHexRegex.exec(normalized)) !== null) {
    const hexPos = m.index + 1;
    const insideRtfQuote = segments.some((s) => hexPos >= s.pos && hexPos < s.end);
    if (!insideRtfQuote) {
      segments.push({ pos: hexPos, end: hexPos + 24, type: 'id', value: m[1] });
    }
  }

  segments.sort((a, b) => a.pos - b.pos);

  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].type === 'name' && segments[i + 1].type === 'id') {
      mappings.set(segments[i].value, segments[i + 1].value);
    }
  }

  return mappings;
}

export function buildSubMaxLookup(templates: BenchmarkTemplate[]): Map<string, SubMaxInfo> {
  const lookup = new Map<string, SubMaxInfo>();
  for (const template of templates) {
    for (const rm of template.templateRepMaxes ?? []) {
      lookup.set(rm._id, { template, subMaxName: rm.name, subMaxType: 'repMax' });
    }
    for (const tsm of template.templateTimeSubMaxes ?? []) {
      lookup.set(tsm._id, { template, subMaxName: tsm.name, subMaxType: 'timeSubMax' });
    }
    for (const dsm of template.templateDistanceSubMaxes ?? []) {
      lookup.set(dsm._id, { template, subMaxName: dsm.name, subMaxType: 'distanceSubMax' });
    }
  }
  return lookup;
}

export function parseMaxName(name: string): ParsedMax {
  const trimmed = name.trim();
  const match = RM_REGEX.exec(trimmed);
  if (match) {
    return { originalName: name, weight: 0, reps: parseInt(match[1], 10), exerciseName: match[2].trim(), category: 'weight' };
  }
  return { originalName: name, weight: 0, reps: null, exerciseName: null, category: 'other' };
}

export function resolveMax(
  parsed: ParsedMax,
  templatesByName: Map<string, BenchmarkTemplate>,
  manualMappings: Map<string, string>,
  subMaxById: Map<string, SubMaxInfo>
): ResolvedMax {
  if (!parsed.originalName.trim()) {
    return { ...parsed, template: null, subMaxName: null, subMaxId: null, subMaxType: null, status: 'empty' };
  }

  const manualId = manualMappings.get(parsed.originalName.trim());
  if (manualId) {
    const info = subMaxById.get(manualId);
    if (info) {
      return { ...parsed, template: info.template, subMaxName: info.subMaxName, subMaxId: manualId, subMaxType: info.subMaxType, status: 'manual' };
    }
  }

  if (parsed.category === 'other') {
    return { ...parsed, template: null, subMaxName: null, subMaxId: null, subMaxType: null, status: 'non-weight' };
  }

  const template = templatesByName.get(parsed.exerciseName!.toLowerCase()) ?? null;
  if (!template) {
    return { ...parsed, template: null, subMaxName: null, subMaxId: null, subMaxType: null, status: 'no-template' };
  }

  const repMaxEntry = template.templateRepMaxes?.find((rm) => rm.reps === parsed.reps!) ?? null;
  if (!repMaxEntry) {
    return { ...parsed, template, subMaxName: null, subMaxId: null, subMaxType: null, status: 'no-rep-max' };
  }

  return { ...parsed, template, subMaxName: repMaxEntry.name, subMaxId: repMaxEntry._id, subMaxType: 'repMax', status: 'matched' };
}
