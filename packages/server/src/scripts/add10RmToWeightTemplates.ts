import mongoose from 'mongoose';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set in environment');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const result = await BenchmarkTemplate.updateMany(
      { type: 'weight', 'templateRepMaxes.reps': { $ne: 10 } },
      { $push: { templateRepMaxes: { reps: 10, name: '10RM' } } }
    );

    console.log(`Migration complete: ${result.modifiedCount} templates updated`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
