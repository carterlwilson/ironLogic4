import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, '../../.env') });

async function exportUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not set in environment');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users`);

    const outputPath = path.resolve(scriptDir, '../../../../client-migration/users.json');
    fs.writeFileSync(outputPath, JSON.stringify(users, null, 2));
    console.log(`Wrote users to ${outputPath}`);

    await mongoose.disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

exportUsers();
