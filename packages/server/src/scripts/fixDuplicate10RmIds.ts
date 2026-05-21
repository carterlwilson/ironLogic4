import mongoose from 'mongoose';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate.js';
import * as dotenv from 'dotenv';

dotenv.config();

const DUPLICATE_ID = '69e98bf555ba10a1e499cca1';

async function migrate() {
  const mongoUri = process.env.MONGODB_PROD_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not set in environment');

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const templates = await BenchmarkTemplate.find({
    'templateRepMaxes._id': new mongoose.Types.ObjectId(DUPLICATE_ID),
  });

  console.log(`Found ${templates.length} templates with duplicate 10RM ID`);

  for (const template of templates) {
    const newId = new mongoose.Types.ObjectId();
    await BenchmarkTemplate.updateOne(
      { _id: template._id },
      { $set: { 'templateRepMaxes.$[elem]._id': newId } },
      { arrayFilters: [{ 'elem._id': new mongoose.Types.ObjectId(DUPLICATE_ID) }] }
    );
    console.log(`Updated "${template.name}": 10RM ID → ${newId}`);
  }

  console.log('Migration complete');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
