import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { getQuote } from './quotesService.js';
import { sendMessage } from './twilioService.js';

const recipientsPath = path.resolve(process.cwd(), 'src/data/recipients.json');

async function getRecipients() {
    try {
        const data = await fs.readFile(recipientsPath, 'utf-8');
        const parsedData = JSON.parse(data);
        return parsedData.recipients.filter(r => r.active);
    } catch (error) {
        logger.error('Failed to load recipients.', { error: error.message });
        return [];
    }
}

async function sendDailyQuotes() {
    logger.info('Starting daily quotes job...');
    const recipients = await getRecipients();
    
    if (recipients.length === 0) {
        logger.warn('No active recipients found. Skipping job.');
        return;
    }

    for (const recipient of recipients) {
        const quote = await getQuote(recipient.preferences);
        if (quote) {
            const messageBody = `"${quote.text}"\n- ${quote.author}`;
            await sendMessage(recipient.phone, messageBody);
        } else {
            logger.error(`Could not get a quote for ${recipient.name}`);
        }
    }
    logger.info('Daily quotes job finished.');
}

export function startScheduler() {
  cron.schedule(config.scheduler.cronSchedule, sendDailyQuotes, {
    scheduled: true,
    timezone: config.scheduler.timezone,
  });

  logger.info(`Scheduler started with schedule: "${config.scheduler.cronSchedule}" in timezone "${config.scheduler.timezone}"`);
}