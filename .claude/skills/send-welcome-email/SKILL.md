---
name: send-welcome-email
description: Send a welcome email to one or more Cully Strength users via SendGrid. Looks up each user in prod MongoDB, generates a 7-day reset token, stores the hashed token, and sends the email. Always show the email content to the user for approval before sending.
user-invocable: true
---

# Send Welcome Email

Use this skill when the user asks to send a welcome email to one or more users.

## Key constants
- **Prod MongoDB URI env var:** `MONGODB_PROD_URI`
- **SendGrid API key env var:** `SENDGRID_API_KEY`
- **Verified sender env var:** `SENDGRID_VERIFIED_SENDER`
- All env vars are in `packages/server/.env`
- **Mobile app URL:** `https://app.cullystrength.com`
- **Password reset URL:** `https://admin.cullystrength.com/reset-password`
- **Token expiry:** 7 days

## Step 1: Verify users exist

Before showing the email or sending anything, confirm each email address exists in the DB using an inline `npx tsx` lookup. If a user is not found, report it and do not attempt to send.

## Step 2: Show email content for approval

Show the user the email that will be sent — subject line and body text — **before sending**. Display it directly in your response text (not buried in a tool call). Wait for explicit approval.

The email content:

**Subject:** `Welcome to the new Cully Strength app!`

**Body:**
```
Hi <firstName>,

Welcome to the new Cully Strength app! We've migrated your account and your benchmark data is ready to go.

If you haven't already reset your password, use the link below to set a new one — it's good for 7 days:
https://admin.cullystrength.com/reset-password?token=<token>

Once you've set your password, you can log in at: https://app.cullystrength.com

See you in the gym!
— The Cully Strength Team
```

## Step 3: Send (after approval)

Write a temporary script to `packages/server/src/scripts/sendEmail<Name>.ts`, run it, delete it.

The script must:
1. Look up each user by email in MongoDB
2. Generate a plain token: `crypto.randomBytes(32).toString('hex')`
3. Hash it: `bcrypt.hash(plainToken, 12)`
4. Store in DB: `$set: { resetToken: hashedToken, resetTokenExpiry: expiry, resetTokenUsed: false, updatedAt: new Date() }`
5. Set expiry 7 days out: `expiry.setDate(expiry.getDate() + 7)`
6. Send via SendGrid with `from: { name: 'Cully Strength', email: verifiedSender }`

Run with:
```bash
MONGODB_PROD_URI=$(grep MONGODB_PROD_URI packages/server/.env | cut -d= -f2-) \
SENDGRID_API_KEY=$(grep SENDGRID_API_KEY packages/server/.env | cut -d= -f2-) \
SENDGRID_VERIFIED_SENDER=$(grep SENDGRID_VERIFIED_SENDER packages/server/.env | cut -d= -f2-) \
npx tsx packages/server/src/scripts/sendEmail<Name>.ts && rm packages/server/src/scripts/sendEmail<Name>.ts
```

The script file must be inside `packages/server/src/scripts/` so tsx picks up the correct tsconfig (ESM, top-level await support).

## Important rules
- Never send without explicit user approval
- Never run any pre-existing script in `src/scripts/` — always write a fresh targeted script
- Always delete the temp script after it runs
