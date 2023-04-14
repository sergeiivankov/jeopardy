import 'dotenv/config';

import compression from 'compression';
import express from 'express';
import helmet from 'helmet';

import { createAppServer, createRedirectServer } from './helpers/create-server.js';
import db, { initDbConnection } from './helpers/database.js';
import errorsHandle from './helpers/errors-handle.js';
import gracefulShutdown from './helpers/graceful-shutdown.js';
import hideDirectStatic from './helpers/hide-direct-static.js';
import logger from './helpers/logger.js';
import strictRoutes from './helpers/strict-routes.js';

import adminRouter from './admin/index.js';
import playerRouter from './player/index.js';

const app = express();
app.enable('case sensitive routing');
app.enable('strict routing');

app.use(logger);
app.use(helmet());
app.use(strictRoutes);
hideDirectStatic(app);
app.use(compression());
app.use(express.static('public', { index: false, redirect: false }));

app.use('/admin', adminRouter);
app.use('/', playerRouter);

errorsHandle(app);

(async () => {
  try {
    await initDbConnection();
  } catch(err) {
    console.log(err);
    process.exit(1);
  }
  console.log('Connected to database', db.config.filename);

  const servers = {};
  servers.appServer = createAppServer(app);
  servers.redirectServer = createRedirectServer();

  gracefulShutdown(servers);
})();