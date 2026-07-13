import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MONGODB_URI } from './constants';

export async function connectDb(): Promise<mongoose.Connection> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
  return mongoose.connection;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

// Backdates a specific repMax/timeSubMax/distanceSubMax bucket's recordedAt on a user's current
// benchmark, so the 5-day staleness threshold can be exercised without waiting real days.
export async function backdateSubMaxRecordedAt(opts: {
  userId: string;
  benchmarkId: string;
  arrayField: 'repMaxes' | 'timeSubMaxes' | 'distanceSubMaxes';
  idField: string;
  bucketId: string;
  date: Date;
}): Promise<void> {
  const conn = await connectDb();
  await conn.collection('users').updateOne(
    {
      _id: new mongoose.Types.ObjectId(opts.userId),
      'currentBenchmarks._id': new mongoose.Types.ObjectId(opts.benchmarkId),
    },
    {
      $set: {
        [`currentBenchmarks.$[cb].${opts.arrayField}.$[item].recordedAt`]: opts.date,
      },
    },
    {
      arrayFilters: [
        { 'cb._id': new mongoose.Types.ObjectId(opts.benchmarkId) },
        { [`item.${opts.idField}`]: opts.bucketId },
      ],
    }
  );
}

// Backdates the benchmark-level recordedAt (used by REPS/OTHER scalar-type staleness).
export async function backdateBenchmarkRecordedAt(
  userId: string,
  benchmarkId: string,
  date: Date
): Promise<void> {
  const conn = await connectDb();
  await conn.collection('users').updateOne(
    {
      _id: new mongoose.Types.ObjectId(userId),
      'currentBenchmarks._id': new mongoose.Types.ObjectId(benchmarkId),
    },
    { $set: { 'currentBenchmarks.$.recordedAt': date } }
  );
}

// Creates a file-local test user (e.g. a second client for cross-tenant isolation tests, or a
// coach for role-check tests) by writing directly to MongoDB, bypassing the API entirely (the
// API has no self-service user-creation endpoint outside the admin-only/invite flows).
export async function createTestUser(opts: {
  email: string;
  userType: string;
  password: string;
}): Promise<string> {
  const conn = await connectDb();
  const hashed = await bcrypt.hash(opts.password, 12);
  const result = await conn.collection('users').insertOne({
    email: opts.email,
    firstName: 'TEST_Extra',
    lastName: 'User',
    userType: opts.userType,
    password: hashed,
    currentBenchmarks: [],
    historicalBenchmarks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function deleteTestUser(userId: string): Promise<void> {
  const conn = await connectDb();
  await conn.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
}
