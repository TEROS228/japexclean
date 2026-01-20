import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Хранилище для кодов верификации (в памяти)
// В production лучше использовать Redis
const verificationCodes = new Map<string, { code: string; timestamp: number }>();

// Очистка устаревших кодов (старше 10 минут)
function cleanExpiredCodes() {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;

  for (const [email, data] of verificationCodes.entries()) {
    if (now - data.timestamp > TEN_MINUTES) {
      verificationCodes.delete(email);
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'This email has already been used for the bonus' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with timestamp
    verificationCodes.set(email.toLowerCase(), {
      code,
      timestamp: Date.now(),
    });

    // Clean expired codes
    cleanExpiredCodes();

    // Send email with verification code
    const { data, error } = await resend.emails.send({
      from: 'Japrix <onboarding@resend.dev>',
      to: [email],
      subject: 'Your Verification Code - Get ¥500 Bonus!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to Japrix!</h1>
                        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Your ¥500 bonus awaits</p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 24px;">
                          Thank you for signing up! To complete your registration and receive your <strong>¥500 welcome bonus</strong>, please verify your email address.
                        </p>

                        <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">
                          Your verification code is:
                        </p>

                        <!-- Verification Code Box -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; display: inline-block;">
                                <div style="font-size: 36px; font-weight: bold; color: #059669; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                  ${code}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 20px;">
                          This code will expire in <strong>10 minutes</strong>. Please enter it on the website to claim your bonus.
                        </p>

                        <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 20px;">
                          If you didn't request this code, please ignore this email.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                          Happy shopping! 🎁
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © 2024 Japrix. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Resend] Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    console.log(`[Verification] Code sent to ${email}, Email ID: ${data?.id}`);

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('[Verification] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Export для использования в других API
export { verificationCodes };
