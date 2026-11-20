import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// Every existing gym (Cully Strength) is in Portland, OR.
const DEFAULT_TIME_ZONE = 'America/Los_Angeles';

async function migrate() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set in environment');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to database:', mongoose.connection.db?.databaseName);

    // Raw collection update: the Gym model now requires timezone, and only gyms without one are touched.
    const result = await mongoose.connection.collection('gyms').updateMany(
      { $or: [{ timezone: { $exists: false } }, { timezone: null }, { timezone: '' }] },
      { $set: { timezone: DEFAULT_TIME_ZONE } }
    );

    console.log(`Migration complete: set timezone to ${DEFAULT_TIME_ZONE} on ${result.modifiedCount} gyms`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
