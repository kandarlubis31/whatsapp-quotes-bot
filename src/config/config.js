import dotenv from 'dotenv';

dotenv.config();

const config = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  },
  scheduler: {
    cronSchedule: process.env.CRON_SCHEDULE || '0 8 * * *',
    timezone: process.env.TIMEZONE || 'Asia/Jakarta',
  },
  api: {
    quotesApiUrl: process.env.QUOTES_API_URL,
    backupApiUrl: process.env.BACKUP_API_URL,
  },
  retry: {
    maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS, 10) || 3,
    delayMs: parseInt(process.env.RETRY_DELAY_MS, 10) || 5000,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '7d',
  },
  port: process.env.PORT || 3000,
};

export default config;