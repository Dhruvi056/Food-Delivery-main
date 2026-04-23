import nodemailer from "nodemailer";
import { logger } from './logger.js';

// Create reusable transporter
const createTransporter = () => {
    // If SMTP credentials are configured, use them
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    // Fallback: log to console (development mode)
    return null;
};

// Generate a 6-digit OTP code
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send 2FA verification email
export const send2FAEmail = async (email, code) => {
    const transporter = createTransporter();

    const htmlContent = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 30px; background: linear-gradient(135deg, #fff5f0 0%, #ffe8de 100%); border-radius: 16px;">
      <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 8px;">🔐 BiteBlitz Login Verification</h1>
      <p style="color: #636e72; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Enter this code to complete your sign-in:</p>
      <div style="background: linear-gradient(135deg, #ff6b35, #e94560); color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
        ${code}
      </div>
      <p style="color: #636e72; font-size: 12px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
    </div>
  `;

    if (transporter) {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"BiteBlitz" <noreply@biteblitz.com>',
                to: email,
                subject: "🔐 Your BiteBlitz Login Code",
                html: htmlContent,
            });
            logger.info(`✉️  2FA email sent to ${email}`);
            return true;
        } catch (error) {
            logger.error('Email send failed:', error);
            // Fall through to console log
        }
    }

    // Development fallback: log OTP to console
    logger.info(`
${'='.repeat(50)}`);
    logger.info(`  🔑 2FA CODE for ${email}: ${code}`);
    logger.info(`${'='.repeat(50)}
`);
    return true;
};

// Send Password Reset Email
export const sendPasswordResetEmail = async (email, resetUrl) => {
    const transporter = createTransporter();

    const htmlContent = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 30px; background: linear-gradient(135deg, #fff5f0 0%, #ffe8de 100%); border-radius: 16px;">
      <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 8px;">🔑 Reset Your Password</h1>
      <p style="color: #636e72; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">You requested a password reset for BiteBlitz. Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="display: block; width: 100%; text-align: center; background: linear-gradient(135deg, #ff6b35, #e94560); color: white; text-decoration: none; padding: 16px 0; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 24px;">
        Reset Password
      </a>
      <p style="color: #636e72; font-size: 12px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

    if (transporter) {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"BiteBlitz" <noreply@biteblitz.com>',
                to: email,
                subject: "🔑 Reset Your BiteBlitz Password",
                html: htmlContent,
            });
            logger.info(`✉️  Password reset email sent to ${email}`);
            return true;
        } catch (error) {
            logger.error('Email send failed:', error);
        }
    }

    // Development fallback
    logger.info(`
${'='.repeat(50)}`);
    logger.info(`  🔗 PASSWORD RESET LINK for ${email}:\n  ${resetUrl}`);
    logger.info(`${'='.repeat(50)}
`);
    return true;
};
