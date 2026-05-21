import mongoose from 'mongoose';
import { User } from './packages/server/dist/models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server package
dotenv.config({ path: join(__dirname, 'packages/server/.env') });

const EMAIL = 'carterlwilson@gmail.com'; // Replace with user's email
const NEW_PASSWORD = 'cartman'; // Replace with new password

async function setPassword() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironlogic4';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: EMAIL }).select('+password');

    if (!user) {
      console.error(`User not found with email: ${EMAIL}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email}`);

    // Update password (will be automatically hashed by pre-save middleware)
    user.password = NEW_PASSWORD;
    await user.save();

    console.log('Password updated successfully!');

  } catch (error) {
    console.error('Error setting password:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

setPassword();