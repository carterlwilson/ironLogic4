import { ClientBenchmark } from './clientBenchmarks.js';

export enum UserType {
  ADMIN = 'admin',
  OWNER = 'owner',
  COACH = 'coach',
  CLIENT = 'client'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  password: string;
  gymId?: string;
  gymName?: string;
  programId?: string;
  currentBenchmarks?: ClientBenchmark[];
  historicalBenchmarks?: ClientBenchmark[];
  createdAt: Date;
  updatedAt: Date;
}