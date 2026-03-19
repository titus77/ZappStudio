import express from 'express';
import * as path from 'path';
import 'source-map-support/register.js';
//import oauth2Router from './routes/oauth2/router';
import config from './config';
import { apiACLCheck, pageACLCheck } from './middlewares/acl.mw';
import { apiAuth, includeTeamDetails, pageAuth } from './middlewares/auth.mw';
import { errorHandler } from './middlewares/error.mw';
import { sessionCheck } from './middlewares/sessionCheck.mw';
import apiRouter from './routes/api/router';
import dbgRouter from './routes/dbg/router';
import oauthRouter from './routes/oauth/router';
import pagesRouter from './routes/pages/router';

//import { handleAuthRoutes, withLogto } from '@logto/express';

import cookieParser from 'cookie-parser';
import session from 'express-session';
//import FileStoreLib from 'session-file-store';
import compression from 'compression';
import RedisStore from 'connect-redis';

import passport from 'passport';
import { version } from '../../package.json';
import { authentikAuthMiddleware } from './middlewares/authentikAuth.mw';
import { initializePassport } from './routes/oauth/helper/passportSetup';
import { ModelsPollingService } from './services/ModelsPolling.service';
import { cacheClient } from './services/cache.service';

const PORT = config.env.PORT || 4000;
const app = express();

app.disable('x-powered-by');

// Serve static files
app.use(compression());
app.use('/', express.static('dist/static'));
app.use('/assets', express.static('dist/assets'));
app.use('/uploads', express.static(path.join(config.env.LOCAL_STORAGE_PATH, 'uploads', 'public')));

app.get('/health', (_, res) => {
  return res.status(200).send({
    success: true,
    version: version,
  });
});

// CORS for iframe cross-origin (ZappImmo embeds ZappStudio)
const ALLOWED_ORIGINS = [
  'https://zapp.immo',
  'https://smythos.zapp.immo',
  process.env.APP_URL,
  process.env.UI_SERVER,
].filter(Boolean) as string[];

// In dev, allow localhost origins
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3100', 'http://localhost:6060', 'http://localhost:5050');
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Smyth-Team-Id');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(authentikAuthMiddleware);

app.use(cookieParser());

const redisStore = new RedisStore({ client: cacheClient.client, prefix: 'smyth_ui_backend:' });
const cookieDays = 30;

const isProd = process.env.NODE_ENV === 'production';

// SEC: Refuse to start in production without SESSION_SECRET
if (!config.env.SESSION_SECRET) {
  if (isProd) {
    console.error('FATAL: SESSION_SECRET is not set in production!');
    process.exit(1);
  }
  console.warn('SESSION_SECRET is not set, using random secret (dev only)');
}

const sessionSecret = config.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex');

app.use(
  session({
    store: config.flags.useRedis ? redisStore : undefined,
    secret: sessionSecret,
    cookie: {
      maxAge: cookieDays * 24 * 60 * 60 * 1000,
      sameSite: isProd ? 'none' : 'lax',  // 'none' for cross-origin iframe in prod
      secure: isProd,                       // secure required with sameSite=none
      domain: isProd ? '.zapp.immo' : undefined,
    },
    saveUninitialized: false,
    resave: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

initializePassport();
app.use(sessionCheck);

app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      // @ts-ignore
      req.rawBody = buf; // for webhooks signature verification
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.use('/api', [apiAuth, apiACLCheck], apiRouter);
app.use('/dbg', [apiAuth], dbgRouter);
app.use('/oauth', oauthRouter);

app.use([pageAuth, pageACLCheck, includeTeamDetails]);

// Set EJS as templating engine
app.set('view engine', 'ejs');
// Set views path
app.set('views', path.resolve('views'));

// Application pages
app.use('/', pagesRouter);

//error handling middlewares
app.use(errorHandler);

let server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('An uncaught error occurred!');
  console.error(err.stack);
});

const modelsPollingService = new ModelsPollingService();
modelsPollingService.start();
