import { onRequest } from 'firebase-functions/v2/https';
import express, { Request, Response } from 'express';

/**
 * DEBUG STEP 3: Diagnostic version — uses dynamic require() with try/catch
 * to identify exactly which module import crashes the Cloud Run container.
 * Each import is wrapped individually so we can see which one fails.
 */

const loadErrors: string[] = [];

function tryRequire(name: string): any {
  try {
    const mod = require(name);
    console.log(`[DIAG] OK: ${name}`);
    return mod.default || mod;
  } catch (err: any) {
    const msg = `[DIAG] FAIL: ${name} — ${err.message}`;
    console.error(msg);
    loadErrors.push(msg);
    return null;
  }
}

// Test each dependency individually
const admin = tryRequire('firebase-admin');
const cors = tryRequire('cors');
const helmet = tryRequire('helmet');
const compression = tryRequire('compression');
const cookieParser = tryRequire('cookie-parser');
const configModule = tryRequire('./config/index.js');
const loggerModule = tryRequire('./utils/logger.js');
const errorHandlerModule = tryRequire('./middleware/errorHandler.js');

// Initialize Firebase Admin if loaded
if (admin) {
  try {
    if (!admin.apps?.length) {
      admin.initializeApp();
    }
    console.log('[DIAG] Firebase Admin initialized OK');
  } catch (err: any) {
    console.error(`[DIAG] Firebase Admin init FAIL: ${err.message}`);
    loadErrors.push(`Firebase Admin init: ${err.message}`);
  }
}

const app = express();
app.use(express.json());

// Health check — reports diagnostic results
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'PharmaConnect Backend — diagnostic mode',
    loadErrors,
    timestamp: new Date(),
  });
});

// Root — diagnostic status
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: 'diagnostic-step-3',
    loadErrors,
    modulesLoaded: {
      'firebase-admin': !!admin,
      cors: !!cors,
      helmet: !!helmet,
      compression: !!compression,
      'cookie-parser': !!cookieParser,
      config: !!configModule,
      logger: !!loggerModule,
      errorHandler: !!errorHandlerModule,
    },
  });
});

// API stub
app.use('/api/v1', (_req: Request, res: Response) => {
  res.json({ message: 'Diagnostic mode — routes disabled', loadErrors });
});

export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '1GiB',
    invoker: 'public',
  },
  app
);
