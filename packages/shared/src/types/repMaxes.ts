export interface RepMax {
  reps: number;          // 1, 2, 3, 5, 8, etc.
  name: string;          // "1RM", "2RM", "3RM", etc.
  weightKg: number;      // The max weight for this rep range
  recordedAt: Date;      // When this specific rep max was tested
  createdAt: Date;
  updatedAt: Date;
}