import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, '../../.env') });

async function exportTemplates() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set in environment');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const templates = await BenchmarkTemplate.find({}).lean();
    console.log(`Found ${templates.length} benchmark templates`);

    const outputPath = path.resolve(scriptDir, '../../../../client-migration/benchmarkTemplates.json');
    fs.writeFileSync(outputPath, JSON.stringify(templates, null, 2));
    console.log(`Wrote templates to ${outputPath}`);

    await mongoose.disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

exportTemplates();
