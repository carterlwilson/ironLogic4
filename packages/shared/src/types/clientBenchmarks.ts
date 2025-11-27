import { BenchmarkType } from './benchmarkTemplates.js';

export interface RepMax {
  id: string;                    // Mongoose _id for subdocument
  templateRepMaxId: string;      // References TemplateRepMax._id
  weightKg: number;              // Client's actual weight
  recordedAt: Date;              // When tested
  createdAt: Date;               // Timestamp
  updatedAt: Date;               // Timestamp
}

// This will be embedded in User documents, not a standalone document
export interface ClientBenchmark {
  id: string; // Mongoose _id for the subdocument
  templateId: string;
  name: string;
  notes?: string;
  type: BenchmarkType;
  tags: string[];
  // Measurement fields (only one populated based on type)
  repMaxes?: RepMax[];           // For WEIGHT type only
  timeSeconds?: number;
  reps?: number;
  otherNotes?: string;
  recordedAt?: Date;             // Only for non-WEIGHT types
  createdAt: Date;
  updatedAt: Date;
}