import { DistanceUnit } from './programs.js';

export enum BenchmarkType {
  WEIGHT = 'weight',
  TIME = 'time',
  REPS = 'reps',
  DISTANCE = 'distance',
  OTHER = 'other'
}

export { DistanceUnit };

export interface TemplateRepMax {
  id: string;           // Mongoose _id for subdocument
  reps: number;         // 1, 2, 3, 5, 8, etc.
  name: string;         // "1RM", "2RM", "3RM", "5RM", "8RM"
}

export interface TemplateTimeSubMax {
  id: string;           // Mongoose _id for subdocument
  name: string;         // "1 min", "3 min", "5 min"
}

export interface TemplateDistanceSubMax {
  id: string;           // Mongoose _id for subdocument
  name: string;         // "100m", "500m", "1 mile"
}

export interface BenchmarkTemplate {
  id: string;
  name: string;
  notes?: string;
  type: BenchmarkType;
  tags: string[];
  templateRepMaxes?: TemplateRepMax[];  // For WEIGHT type only
  templateTimeSubMaxes?: TemplateTimeSubMax[];  // For DISTANCE type only
  templateDistanceSubMaxes?: TemplateDistanceSubMax[];  // For TIME type only
  distanceUnit?: DistanceUnit;  // For DISTANCE and TIME types only
  gymId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}