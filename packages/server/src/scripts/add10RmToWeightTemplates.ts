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

    // Use individual updateOne calls so each template gets a unique _id for the new subdocument.
    // updateMany + $push without an explicit _id stamps the same generated ObjectId across all
    // matched documents, producing cross-document duplicate subdocument IDs.
    const templates = await BenchmarkTemplate.find({
      type: 'weight',
      'templateRepMaxes.reps': { $ne: 10 },
    });

    console.log(`Found ${templates.length} templates to update`);

    for (const template of templates) {
      await BenchmarkTemplate.updateOne(
        { _id: template._id },
        { $push: { templateRepMaxes: { _id: new mongoose.Types.ObjectId(), reps: 10, name: '10RM' } } }
      );
      console.log(`Updated "${template.name}"`);
    }

    console.log(`Migration complete: ${templates.length} templates updated`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
