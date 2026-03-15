import { webhookCallback } from 'grammy';
import { createBot } from './bot';
import { config } from './config';

const { token, webhookUrl, port } = config;

if (!token) {
  console.error('TOKEN environment variable is required');
  process.exit(1);
}

const bot = createBot(token);
const webhookPath = `/bot${token}`;

if (webhookUrl) {
  const handleUpdate = webhookCallback(bot, 'bun');
  
  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      if (req.method === 'POST' && url.pathname === webhookPath) {
        return handleUpdate(req);
      }
      if (url.pathname === '/health') {
        return new Response('OK');
      }
      return new Response('Not Found', { status: 404 });
    },
  });

  console.log(`Bot server running on port ${port} (Webhook mode)`);
  
  try {
    await bot.api.setWebhook(`${webhookUrl}${webhookPath}`);
    console.log('Webhook registered');
  } catch (err) {
    console.error('Failed to register webhook:', err);
  }
} else {
  // Fallback to Long Polling
  try {
    await bot.api.deleteWebhook();
  } catch (err) {
    console.error('Failed to delete webhook:', err);
  }
  
  bot.start();
  console.log('Bot started in Long Polling mode (no WEBHOOK_URL provided)');
  
  // Still run a simple health-check server if port is provided
  Bun.serve({
    port,
    fetch(req) {
      if (new URL(req.url).pathname === '/health') {
        return new Response('OK');
      }
      return new Response('Not Found', { status: 404 });
    }
  });
}
