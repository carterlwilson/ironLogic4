import sgMail from '@sendgrid/mail';

// Initialize SendGrid - deferred until first use
function initializeSendGrid(): void {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (sendGridApiKey) {
    sgMail.setApiKey(sendGridApiKey);
  }
}

/**
 * Send a password reset email to the user via SendGrid
 * @param email The recipient's email address
 * @param firstName The recipient's first name for personalization
 * @param resetToken The plain text reset token (not hashed)
 */
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetToken: string
): Promise<void> => {
  initializeSendGrid();

  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  if (!sendGridApiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is not set');
  }

  if (!verifiedSender) {
    throw new Error('SENDGRID_VERIFIED_SENDER environment variable is not set');
  }

  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

  const msg = {
    to: email,
    from: verifiedSender,
    subject: 'Reset your gym account password',
    text: `Hi ${firstName},\n\nYou recently requested to reset your password for your gym account.\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link will expire in 30 minutes.\n\nIf you did not request a password reset, please ignore this email or contact support if you have concerns.\n\nBest regards,\nYour Gym Team`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #228be6; margin-top: 0;">Password Reset Request</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              You recently requested to reset your password for your gym account.
            </p>
            <p style="font-size: 16px; margin-bottom: 30px;">
              Click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #228be6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #228be6; word-break: break-all; margin-bottom: 20px;">
              ${resetLink}
            </p>
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>Important:</strong> This link will expire in 30 minutes for security purposes.
              </p>
            </div>
          </div>
          <div style="font-size: 13px; color: #666; padding: 20px 0; border-top: 1px solid #e9ecef;">
            <p style="margin: 0 0 10px 0;">
              If you did not request a password reset, please ignore this email or contact support if you have concerns.
            </p>
            <p style="margin: 0;">
              Best regards,<br>
              Your Gym Team
            </p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`[EMAIL] Password reset email sent successfully to ${email}`);
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send password reset email:', error);

    // Log the error but don't expose SendGrid details to the caller
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as { response?: { body?: unknown } };
      console.error('[EMAIL ERROR] SendGrid response:', sgError.response?.body);
    }

    throw new Error('Failed to send password reset email');
  }
};
