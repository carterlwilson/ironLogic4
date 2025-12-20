import mongoose from 'mongoose';
import { User } from '../models/User.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration script to add refreshTokens field to existing users
 * Run this after deploying the refresh token feature
 */
async function migrateUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI not set in environment');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Update all users without refreshTokens field
    const result = await User.updateMany(
      { refreshTokens: { $exists: false } },
      { $set: { refreshTokens: [] } }
    );

    console.log(`Migration complete: ${result.modifiedCount} users updated`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers();
