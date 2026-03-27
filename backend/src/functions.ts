import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'PharmaConnect API is live', timestamp: new Date() });
});

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'PharmaConnect API' });
});

export const api = onRequest(
  { region: 'us-central1', timeoutSeconds: 60, memory: '256MiB' },
  app
);
