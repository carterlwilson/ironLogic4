import { BenchmarkType } from './benchmarkTemplates.js';

export interface RepMax {
  id: string;                    // Mongoose _id for subdocument
  templateRepMaxId: string;      // References TemplateRepMax._id
  weightKg: number;              // Client's actual weight
  recordedAt: Date;              // When tested
  createdAt: Date;               // Timestamp
  updatedAt: Date;               // Timestamp
}

export interface TimeSubMax {
  id: string;                      // Mongoose _id for subdocument
  templateSubMaxId: string;        // References TemplateTimeSubMax or TemplateDistanceSubMax
  distanceMeters: number;          // Distance in meters (normalized)
  recordedAt: Date;                // When tested
  createdAt: Date;                 // Timestamp
  updatedAt: Date;                 // Timestamp
}

export interface DistanceSubMax {
  id: string;                        // Mongoose _id for subdocument
  templateDistanceSubMaxId: string;  // References TemplateDistanceSubMax._id
  timeSeconds: number;               // Time in seconds (ALWAYS stored as seconds, normalized)
  recordedAt: Date;                  // When tested
  createdAt: Date;                   // Timestamp
  updatedAt: Date;                   // Timestamp
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
  timeSubMaxes?: TimeSubMax[];   // For DISTANCE type only
  distanceSubMaxes?: DistanceSubMax[];  // For TIME type benchmarks (NEW structure)
  timeSeconds?: number;
  reps?: number;
  otherNotes?: string;
  recordedAt?: Date;             // Only for non-WEIGHT, non-DISTANCE types
  createdAt: Date;
  updatedAt: Date;
}