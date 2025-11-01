export enum BenchmarkType {
  WEIGHT = 'weight',
  TIME = 'time',
  REPS = 'reps',
  OTHER = 'other'
}

export interface BenchmarkTemplate {
  id: string;
  name: string;
  notes?: string;
  type: BenchmarkType;
  tags: string[];
  gymId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}