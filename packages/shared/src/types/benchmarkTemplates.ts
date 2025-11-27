export enum BenchmarkType {
  WEIGHT = 'weight',
  TIME = 'time',
  REPS = 'reps',
  OTHER = 'other'
}

export interface TemplateRepMax {
  id: string;           // Mongoose _id for subdocument
  reps: number;         // 1, 2, 3, 5, 8, etc.
  name: string;         // "1RM", "2RM", "3RM", "5RM", "8RM"
}

export interface BenchmarkTemplate {
  id: string;
  name: string;
  notes?: string;
  type: BenchmarkType;
  tags: string[];
  templateRepMaxes?: TemplateRepMax[];  // For WEIGHT type only
  gymId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}