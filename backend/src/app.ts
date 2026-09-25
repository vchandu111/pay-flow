import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env, isProduction } from './config/env.js';
import { logger } from './lib/logger.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { verifyOrigin } from './middleware/verifyOrigin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './auth/auth.routes.js';
import { usersRouter } from './users/users.routes.js';
import { walletsRouter } from './wallets/wallets.routes.js';
import { transfersRouter } from './transfers/transfers.routes.js';
import { beneficiariesRouter } from './beneficiaries/beneficiaries.routes.js';
import { transactionsRouter } from './transactions/transactions.routes.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // Relaxed in dev so it doesn't fight Vite's separate dev-server origin/HMR;
      // in production the built frontend is served same-origin by this app.
      contentSecurityPolicy: isProduction,
    }),
  );
  // Reflects whatever Origin the caller sends (instead of allowlisting env.CORS_ORIGIN)
  // so third-party integrations don't get blocked by CORS during development.
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '32kb' }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));

  app.use('/api', apiLimiter);
  app.use('/api', verifyOrigin);

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/wallets', walletsRouter);
  app.use('/api/transfers', transfersRouter);
  app.use('/api/beneficiaries', beneficiariesRouter);
  app.use('/api/transactions', transactionsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
