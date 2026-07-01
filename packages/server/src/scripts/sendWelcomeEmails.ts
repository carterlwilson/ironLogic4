import mongoose from 'mongoose';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const OUTPUT       = '/Users/carterwilson/Repos/IronLogic4/packages/server/output';
const DELAY_MS     = 500;
const MOBILE_URL   = 'https://app.cullystrength.com';
const RESET_BASE   = 'https://admin.cullystrength.com/reset-password';
const TEST_EMAIL   = 'carterlwilson@gmail.com';
const TEST_MODE    = process.argv.includes('--test');

const importUsers: { email: string; firstName: string; lastName: string }[] =
  JSON.parse(readFileSync(`${OUTPUT}/import-users.json`, 'utf-8'));

const sendGridApiKey    = process.env.SENDGRID_API_KEY!;
const verifiedSender    = process.env.SENDGRID_VERIFIED_SENDER!;
const mongoUri          = process.env.MONGODB_PROD_URI!;

if (!sendGridApiKey)  { console.error('SENDGRID_API_KEY not set'); process.exit(1); }
if (!verifiedSender)  { console.error('SENDGRID_VERIFIED_SENDER not set'); process.exit(1); }
if (!mongoUri)        { console.error('MONGODB_PROD_URI not set'); process.exit(1); }

sgMail.setApiKey(sendGridApiKey);

await mongoose.connect(mongoUri);
const db = mongoose.connection.db!;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

if (TEST_MODE) console.log('TEST MODE — sending one email to', TEST_EMAIL, '\n');

let sent = 0, skipped = 0, failed = 0;

for (const user of TEST_MODE ? importUsers.slice(0, 1) : importUsers) {
  const email = user.email.toLowerCase().trim();
  process.stdout.write(`${email} ... `);

  const dbUser = await db.collection('users').findOne({ email });
  if (!dbUser) {
    console.log('SKIPPED (user not found in DB)');
    skipped++;
    await sleep(DELAY_MS);
    continue;
  }

  try {
    // Generate a reset token valid for 7 days
    const plainToken  = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(plainToken, 12);
    const expiry      = new Date();
    expiry.setDate(expiry.getDate() + 7);

    await db.collection('users').updateOne(
      { _id: dbUser._id },
      { $set: { resetToken: hashedToken, resetTokenExpiry: expiry, resetTokenUsed: false, updatedAt: new Date() } }
    );

    const resetLink = `${RESET_BASE}?token=${plainToken}`;
    const recipient = TEST_MODE ? TEST_EMAIL : email;
    const firstName = user.firstName || 'there';

    const msg = {
      to:      recipient,
      from:    verifiedSender,
      subject: 'Welcome to the new Cully Strength app!',
      text: [
        `Hi ${firstName},`,
        '',
        "Welcome to the new Cully Strength app! We've migrated your account and your benchmark data is ready to go.",
        '',
        "If you haven't already reset your password, use the link below to set a new one — it's good for 7 days:",
        resetLink,
        '',
        `Once you've set your password, you can log in and track your progress at: ${MOBILE_URL}`,
        '',
        "We're excited to have you on board. See you in the gym!",
        '',
        '— The Cully Strength Team',
      ].join('\n'),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Cully Strength</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #228be6; margin-top: 0;">Welcome to Cully Strength!</h1>
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                We've migrated your account to the new Cully Strength app — your benchmark data is already loaded and ready to go.
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                If you haven't already set a new password, click the button below. This link is good for <strong>7 days</strong>.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #228be6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Set My Password
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-bottom: 8px;">Or copy and paste this link into your browser:</p>
              <p style="font-size: 14px; color: #228be6; word-break: break-all; margin-bottom: 24px;">${resetLink}</p>
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;">
              <p style="font-size: 16px; margin-bottom: 8px;">Once you're set up, log in and track your progress at:</p>
              <p style="font-size: 16px; margin-bottom: 0;">
                <a href="${MOBILE_URL}" style="color: #228be6;">${MOBILE_URL}</a>
              </p>
            </div>
            <div style="font-size: 13px; color: #666; padding: 20px 0; border-top: 1px solid #e9ecef;">
              <p style="margin: 0;">
                We're excited to have you on board. See you in the gym!<br>
                — The Cully Strength Team
              </p>
            </div>
          </body>
        </html>
      `,
    };

    await sgMail.send(msg);
    console.log(`OK${TEST_MODE ? ' (test → ' + TEST_EMAIL + ')' : ''}`);
    sent++;
  } catch (err: any) {
    console.log(`FAILED (${err.message})`);
    failed++;
  }

  await sleep(DELAY_MS);
}

await mongoose.disconnect();
console.log(`\nDone — sent: ${sent}, skipped: ${skipped}, failed: ${failed}`);
