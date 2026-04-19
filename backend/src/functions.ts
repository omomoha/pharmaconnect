import { onRequest } from 'firebase-functions/v2/https';
import express, { Request, Response } from 'express';

/**
 * MINIMAL Cloud Function for debugging Container Healthcheck failure.
 * Stripped to bare minimum — no firebase-admin, no custom config, no routes.
 * If this deploys, the issue is in our dependencies/application code.
 * If this fails, the issue is infrastructure.
 */

const app = express();

app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'PharmaConnect Backend is healthy (minimal)',
    timestamp: new Date(),
  });
});

// Root handler
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: 'minimal-debug' });
});

// API stub
app.use('/api/v1', (_req: Request, res: Response) => {
  res.json({ message: 'Minimal API stub — full routes disabled for deploy debugging' });
});

export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '256MiB',
    invoker: 'public',
  },
  app
);
