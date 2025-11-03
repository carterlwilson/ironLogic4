import { BenchmarkType } from './benchmarkTemplates.js';

// This will be embedded in User documents, not a standalone document
export interface ClientBenchmark {
  id: string; // Mongoose _id for the subdocument
  templateId: string;
  name: string;
  notes?: string;
  type: BenchmarkType;
  tags: string[];
  // Measurement fields (only one populated based on type)
  weightKg?: number;
  timeSeconds?: number;
  reps?: number;
  otherNotes?: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}