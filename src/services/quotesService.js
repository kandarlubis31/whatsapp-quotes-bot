import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import https from 'https';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const localQuotesPath = path.resolve(process.cwd(), 'src/data/quotes.json');
let localQuotesCache = [];

// FUNGSI BARU UNTUK MENERJEMAHKAN TEKS
async function translateText(textToTranslate) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(textToTranslate)}`;
    const response = await axios.get(url);
    const translatedText = response.data[0][0][0];
    return translatedText;
  } catch (error) {
    logger.error('Failed to translate text.', { error: error.message });
    return textToTranslate; // Jika gagal, kembalikan teks asli
  }
}


async function loadLocalQuotes() {
  if (localQuotesCache.length > 0) {
    return localQuotesCache;
  }
  try {
    const data = await fs.readFile(localQuotesPath, 'utf-8');
    const parsedData = JSON.parse(data);
    localQuotesCache = parsedData.quotes;
    return localQuotesCache;
  } catch (error) {
    logger.error('Failed to load local quotes from JSON file.', {
      error: error.message,
    });
    return [];
  }
}

async function getQuoteFromApi(apiUrl) {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    const response = await axios.get(apiUrl, { httpsAgent: agent });

    if (response.data && response.data.content) {
      return { text: response.data.content, author: response.data.author || 'Unknown' };
    }
    if (response.data && Array.isArray(response.data) && response.data[0]?.q) {
      return { text: response.data[0].q, author: response.data[0].a || 'Unknown' };
    }
    return null;
  } catch (error) {
    logger.warn(`Failed to fetch quote from API: ${apiUrl}`, { error: error });
    return null;
  }
}

async function getLocalQuote(preferences = []) {
  const quotes = await loadLocalQuotes();
  if (quotes.length === 0) return null;

  let filteredQuotes = quotes;
  if (preferences.length > 0) {
    filteredQuotes = quotes.filter((q) => preferences.includes(q.category));
  }

  if (filteredQuotes.length === 0) {
    filteredQuotes = quotes;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  return filteredQuotes[randomIndex];
}

export async function getQuote(preferences) {
  let quote = await getQuoteFromApi(config.api.quotesApiUrl);

  if (!quote) {
    logger.info('Primary API failed, trying backup API.');
    quote = await getQuoteFromApi(config.api.backupApiUrl);
  }

  if (!quote) {
    logger.info('All APIs failed, falling back to local quotes.');
    quote = await getLocalQuote(preferences);
  }

  if (!quote) {
    logger.error('All quote sources failed. Using hardcoded emergency quote.');
    return {
      text: 'Believe you can and you\'re halfway there.',
      author: 'Theodore Roosevelt',
    };
  }

  // MODIFIKASI: TERJEMAHKAN KUTIPAN SEBELUM DIKEMBALIKAN
  if (quote && quote.text) {
      logger.info(`Original quote: "${quote.text}"`);
      quote.text = await translateText(quote.text);
      logger.info(`Translated quote: "${quote.text}"`);
  }

  return quote;
}