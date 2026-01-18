import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const createEmailTransporter = () => {
  const isGmail = process.env.SMTP_HOST?.includes('gmail');
  
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP not fully configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS');
    // Return a dummy transporter
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
    });
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    ...(isGmail && {
      tls: {
        rejectUnauthorized: false
      }
    }),
    // Add timeout to prevent hanging
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

export const testEmailConnection = async (): Promise<boolean> => {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not configured');
      return false;
    }

    const transporter = createEmailTransporter();
    
    // Skip verification for streamTransport (dummy)
    if (transporter.transporter.name === 'StreamTransport') {
      return false;
    }
    
    await transporter.verify();
    console.log('✅ Email service connected successfully');
    console.log(`📧 Using SMTP: ${process.env.SMTP_HOST}`);
    console.log(`👤 Email account: ${process.env.SMTP_USER}`);
    return true;
  } catch (error: any) {
    console.warn('⚠️ Email service connection failed:', error.message);
    return false;
  }
};