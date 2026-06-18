import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';
import { generateResetToken, hashResetToken } from '../utils/tokenGenerator.js';
import { sendWelcomeEmail } from '../utils/emailService.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, '../../.env') });

const TEST_EMAIL = 'carter@wilson-software.com';
const isTest = process.argv.includes('--test');
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

async function run() {
  const importPath = path.resolve(scriptDir, '../../../../client-migration/import-preview.json');
  if (!fs.existsSync(importPath)) {
    console.error('import-preview.json not found.');
    process.exit(1);
  }

  const allClients: { email: string; firstName: string; lastName: string }[] = JSON.parse(
    fs.readFileSync(importPath, 'utf-8')
  );

  const targets = isTest
    ? [{ email: TEST_EMAIL, firstName: 'Carter', lastName: 'Wilson' }]
    : allClients;

  if (isTest) {
    console.log(`TEST MODE — sending only to ${TEST_EMAIL}`);
  } else {
    console.log(`Sending welcome emails to ${targets.length} clients...`);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not set in environment');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  let sent = 0;
  let failed = 0;

  for (const client of targets) {
    try {
      const plaintextToken = generateResetToken();
      const hashedToken = await hashResetToken(plaintextToken);
      const expiry = new Date(Date.now() + SEVEN_DAYS_MS);

      await User.updateOne(
        { email: client.email.toLowerCase() },
        { $set: { resetToken: hashedToken, resetTokenExpiry: expiry, resetTokenUsed: false } }
      );

      await sendWelcomeEmail(client.email, client.firstName, plaintextToken);
      sent++;
    } catch (err) {
      console.error(`  FAILED ${client.email}:`, err instanceof Error ? err.message : err);
      failed++;
    }

    // Small delay to avoid SendGrid rate limit spikes
    await new Promise(res => setTimeout(res, 200));
  }

  await mongoose.disconnect();

  console.log('');
  console.log(`Sent:   ${sent}`);
  console.log(`Failed: ${failed}`);
}

run().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
