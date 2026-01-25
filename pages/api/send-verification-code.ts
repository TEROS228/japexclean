import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { validateEmailForBonus } from '@/lib/email-validator';

const resend = new Resend(process.env.RESEND_API_KEY);

// Очистка устаревших кодов (старше 10 минут) из базы данных
async function cleanExpiredCodes() {
  const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000);

  await prisma.verificationCode.deleteMany({
    where: {
      timestamp: { lt: TEN_MINUTES_AGO }
    }
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Get user's IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0]
    : req.socket.remoteAddress || 'unknown';

  // Validate email format and check for disposable emails
  const emailValidation = validateEmailForBonus(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ error: emailValidation.error });
  }

  const normalizedEmail = emailValidation.normalizedEmail || email.toLowerCase();

  try {
    // Rate Limiting: 1 регистрация с IP в день
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ipAttemptsToday = await prisma.registrationAttempt.count({
      where: {
        ip: ip,
        timestamp: { gte: today }
      }
    });

    if (ipAttemptsToday >= 1) {
      console.log(`[Rate Limit] IP ${ip} blocked: ${ipAttemptsToday} attempts today`);
      return res.status(429).json({
        error: 'You can only register one account per day from this device. Please try again tomorrow.'
      });
    }

    // Check if user with this email already exists (проверяем по normalized)
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'This email has already been used for the bonus' });
    }

    // Проверка на Gmail aliases (test+1@gmail.com = test@gmail.com)
    if (normalizedEmail !== email.toLowerCase()) {
      const emailAttemptsToday = await prisma.registrationAttempt.count({
        where: {
          email: normalizedEmail,
          timestamp: { gte: today }
        }
      });

      if (emailAttemptsToday >= 1) {
        console.log(`[Rate Limit] Email alias detected: ${email} → ${normalizedEmail}`);
        return res.status(429).json({
          error: 'This email address (or its alias) has already been used for registration today.'
        });
      }
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean expired codes first
    await cleanExpiredCodes();

    // Delete any existing code for this email
    await prisma.verificationCode.deleteMany({
      where: { email: email.toLowerCase() }
    });

    // Store code in database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.verificationCode.create({
      data: {
        email: email.toLowerCase(),
        code: code,
        expiresAt: expiresAt
      }
    });

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

      // Показываем код в консоли если email не отправился
      console.log('═══════════════════════════════════════');
      console.log('📧 EMAIL FAILED - SHOWING CODE IN CONSOLE');
      console.log('Email:', email);
      console.log('Verification Code:', code);
      console.log('═══════════════════════════════════════');

      // Все равно возвращаем success чтобы можно было продолжить
      return res.status(200).json({
        success: true,
        message: 'Verification code sent (check server logs)',
        devMode: true,
      });
    }

    console.log(`[Verification] Code sent to ${email}, Email ID: ${data?.id}`);
    console.log('═══════════════════════════════════════');
    console.log('📧 VERIFICATION CODE');
    console.log('Email:', email);
    console.log('Code:', code);
    console.log('═══════════════════════════════════════');

    // Записываем успешную попытку регистрации
    await prisma.registrationAttempt.create({
      data: {
        ip: ip,
        email: normalizedEmail,
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('[Verification] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Функция для получения кода из базы данных (для использования в других API)
export async function getVerificationCode(email: string): Promise<{ code: string; timestamp: Date } | null> {
  const storedCode = await prisma.verificationCode.findFirst({
    where: { email: email.toLowerCase() },
    orderBy: { timestamp: 'desc' }
  });

  if (!storedCode) return null;

  return {
    code: storedCode.code,
    timestamp: storedCode.timestamp
  };
}

// Функция для удаления кода после использования
export async function deleteVerificationCode(email: string): Promise<void> {
  await prisma.verificationCode.deleteMany({
    where: { email: email.toLowerCase() }
  });
}
