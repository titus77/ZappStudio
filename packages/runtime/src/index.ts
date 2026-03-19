import compression from 'compression';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import express from 'express';
import session from 'express-session';
import fs from 'fs';
import { Server } from 'http';
import path from 'path';
import 'source-map-support/register.js';
import url from 'url';

import { Logger, SmythRuntime, version } from '@smythos/sre';

// Core imports
import config from '@core/config';
import { startServers } from '@core/management-router';
import { requestContext } from '@core/services/request-context';

import cors from '@core/middlewares/cors.mw';
import { errorHandler, notFoundHandler } from '@core/middlewares/error.mw';
import RateLimiter from '@core/middlewares/rateLimiter.mw';

import { registerConnectors } from '@core/connectors/connectorRegistry';

// Routes are handled by configureAgentRouters

// Shared router configuration
import { configureAgentRouters, createCombinedServerConfig } from '@core/router-config';

// Embodiment imports
import { routes as embodimentRoutes } from '@embodiment/routes';

const app = express();
const port = config.env.PORT;

const prepareSREConfigFiles = () => {
  // setup base dir for SRE
  const srePath = config.env.SRE_STORAGE_PATH;
  if (!fs.existsSync(srePath)) {
    fs.mkdirSync(srePath, { recursive: true });
  }

  //  setup base vault content

  const baseVaultContent = {
    development: {
      echo: '',
      openai: '$env(OPENAI_API_KEY)',
      anthropic: '',
      googleai: '',
      groq: '',
      togetherai: '',
      xai: '',
      deepseek: '',
      tavily: '',
      scrapfly: '',
    },
  };

  const vaultFilePath = path.join(config.env.SRE_STORAGE_PATH, '.sre', 'vault.json');
  const dir = path.dirname(vaultFilePath);
  fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(vaultFilePath)) {
    fs.writeFileSync(vaultFilePath, JSON.stringify(baseVaultContent, null, 2));
  }
};

prepareSREConfigFiles();
// Register all connectors
registerConnectors();

process.env.SMYTH_PATH = config.env.SRE_STORAGE_PATH; // needed for SRE initialization
const sre = SmythRuntime.Instance.init({
  Cache: {
    Connector: 'RAM',
    Settings: {},
  },
  Account: {
    Connector: 'SmythOSSAccount',
    Settings: {
      oAuthAppID: config.env.LOGTO_M2M_APP_ID,
      oAuthAppSecret: config.env.LOGTO_M2M_APP_SECRET,
      oAuthBaseUrl: `${config.env.LOGTO_SERVER}/oidc/token`,
      oAuthResource: config.env.LOGTO_API_RESOURCE,
      oAuthScope: '',
      smythAPIBaseUrl: `${config.env.MIDDLEWARE_API_BASE_URL}/_sysapi`,
    },
  },
  Vault: {
    Connector: 'JSONFileVault',
    Settings: {
      shared: 'development',
    },
  },
  Component: {
    Connector: 'LocalComponent',
  },
  AgentData: {
    Connector: 'SmythOSSAgentData',
    Settings: {
      agentStageDomain: config.env.DEFAULT_AGENT_DOMAIN || '',
      agentProdDomain: config.env.PROD_AGENT_DOMAIN || '',
      smythAPIBaseUrl: `${config.env.MIDDLEWARE_API_BASE_URL}/_sysapi`,
    },
  },
  Log: {
    Connector: 'ConsoleLog',
    Settings: {},
  },
});

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const console = Logger('runtime-server');

// Helper function for session ID generation
function getCurrentFormattedDate() {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, '');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Generic CORS
app.use(cors);
app.options('*', cors);

// Serve static files first for optimal performance
app.use('/static', [compression()], express.static(path.join(__dirname, '../static')));

// =============================================================================
// ZappImmo /wai path-based agent routing
// Caddy sends full path: /wai/{agentId}/chatbot → extract agentId, rewrite URL
// Static assets: /wai/static/* → rewrite to /static/* (shared, no agent)
// Health/root: /wai/health, /wai/ → rewrite to /health, / (no agent)
// Custom domains: no /wai prefix → skip (hostname-based resolution in agentLoader)
// =============================================================================
const WAI_PREFIX = '/wai/';
const WAI_STATIC_RE = /^\/wai\/(static\/.*)$/;
// cuid = 25 chars lowercase alphanumeric; also accept 20-30 range for flexibility
const WAI_AGENT_RE = /^\/wai\/([a-z0-9]{20,30})\/(.*)/;
// Non-agent /wai paths (health, root, etc.)
const WAI_PASSTHROUGH_RE = /^\/wai\/(health|$)/;
// Dangerous debug headers to strip on public /wai/* routes
const DEBUG_HEADERS_TO_STRIP = [
  'x-debug-run', 'x-debug-read', 'x-debug-inj', 'x-debug-stop', 'x-debug-skip',
  'x-force-debugger', 'x-monitor-id',
];

app.use((req: any, res, next) => {
  if (!req.url.startsWith(WAI_PREFIX)) {
    return next();
  }

  // Strip dangerous debug headers on public /wai/* routes
  for (const header of DEBUG_HEADERS_TO_STRIP) {
    delete req.headers[header];
  }

  // /wai/static/* → /static/* (shared assets, no agent context)
  const staticMatch = req.url.match(WAI_STATIC_RE);
  if (staticMatch) {
    req.url = '/' + staticMatch[1];
    return next();
  }

  // /wai/health or /wai/ → passthrough without agent
  const passthroughMatch = req.url.match(WAI_PASSTHROUGH_RE);
  if (passthroughMatch) {
    req.url = '/' + (passthroughMatch[1] || '');
    return next();
  }

  // /wai/{agentId}/{rest} → extract agent, rewrite to /{rest}
  const agentMatch = req.url.match(WAI_AGENT_RE);
  if (agentMatch) {
    req._pathAgentSlug = agentMatch[1];
    req._waiRoute = true;
    req.url = '/' + agentMatch[2];
    return next();
  }

  // /wai/something-else (not a valid agent slug) → 404
  res.status(404).json({ error: 'Not Found' });
});

// Request context middleware
app.use((req, res, next) => {
  requestContext.run(() => {
    next();
  }, {});
});

app.use(cookieParser());

// Session middleware for chatbot functionality
app.use(
  session({
    name: 'smythos_runtime_session',
    secret: config.env.SESSION_SECRET || 'default-session-secret-for-dev',
    cookie: {
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
      sameSite: config.env.NODE_ENV === 'development' ? 'lax' : 'none',
      secure: config.env.NODE_ENV !== 'development',
      // Scope cookie to /wai path to avoid conflicts with frontend on same domain (zap.immo)
      path: config.env.WAI_COOKIE_PATH || '/',
    },
    resave: false,
    saveUninitialized: true,
    genid: req => {
      if (req.sessionID && req.session) {
        return req.sessionID;
      }
      const domain = req.hostname;
      const isTestDomain = domain.includes(`.${config.env.DEFAULT_AGENT_DOMAIN}`);
      const prefix = isTestDomain ? 'test-' : '';
      const formattedDate = getCurrentFormattedDate();
      const randomString = crypto.randomBytes(8).toString('hex');
      return `${prefix}${formattedDate}-${randomString}`;
    },
  }),
);

app.use(RateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Health endpoint
app.get('/health', (req: any, res) => {
  let agentDomain = config.env.DEFAULT_AGENT_DOMAIN;
  if (config.env.AGENT_DOMAIN_PORT) agentDomain += `:${config.env.AGENT_DOMAIN_PORT}`;

  res.send({
    message: 'Health Check Complete',
    hostname: req.hostname,
    agent_domain: agentDomain,
    success: true,
    node: port?.toString()?.substr(2),
    name: 'smythos-runtime-server',
    sre_version: version,
  });
});

// Root endpoint
app.get('/', (req: any, res) => {
  res.send(`SmythOS Runtime Server`);
});

// Configure agent routers using shared implementation
configureAgentRouters(app, createCombinedServerConfig());

app.use('/', embodimentRoutes);

// 404 handler - must come before error handler
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

let server: Server | null = null;

(async () => {
  try {
    console.info('🚀 Starting SmythOS Runtime Services...');
    console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Start the main servers (runtime + management)
    console.info('⚡ Starting Main Runtime Services...');
    server = startServers();

    // Log all running services
    console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.info('🎯 All Services Running:');
    console.info(`   • Management Server: http://localhost:${config.env.ADMIN_PORT || '5054'}`);
    console.info(`   • Runtime Server:    http://localhost:${port}`);
    console.info(`   • SRE Models Sync:   Managed by git-sync container`);
    console.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.info('✨ SmythOS Runtime is ready!');
  } catch (error) {
    console.error('❌ Failed to start services:', error);
  }
})();

process.on('uncaughtException', err => {
  console.error('An uncaught error occurred!');
  console.error(err.stack);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.info(`Received ${signal}, shutting down gracefully`);

  try {
    // Close HTTP server if it exists
    if (server) {
      server.close(() => {
        console.info('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app };
