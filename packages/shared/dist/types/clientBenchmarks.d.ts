import { BenchmarkType } from './benchmarkTemplates.js';
export interface ClientBenchmark {
    id: string;
    templateId: string;
    name: string;
    notes?: string;
    type: BenchmarkType;
    tags: string[];
    weightKg?: number;
    timeSeconds?: number;
    reps?: number;
    otherNotes?: string;
    recordedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=clientBenchmarks.d.ts.map