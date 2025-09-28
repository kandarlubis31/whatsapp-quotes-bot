import twilio from 'twilio';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export async function sendMessage(to, body) {
  try {
    const message = await client.messages.create({
      body: body,
      from: config.twilio.whatsappNumber,
      to: to,
    });
    logger.info(`Message sent to ${to}. SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    logger.error(`Failed to send message to ${to}.`, { error: error.message });
    return { success: false, error: error.message };
  }
}