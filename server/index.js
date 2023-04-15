import 'dotenv/config';

import compression from 'compression';
import express from 'express';
import helmet from 'helmet';

import { createAppServer, createRedirectServer } from './helpers/create-server.js';
import errorsHandle from './helpers/errors-handle.js';
import gracefulShutdown from './helpers/graceful-shutdown.js';
import hideDirectStatic from './helpers/hide-direct-static.js';
import initDatabase from './helpers/init-database.js';
import logger from './helpers/logger.js';
import { initStorage } from './helpers/storage.js';
import strictRoutes from './helpers/strict-routes.js';

import adminRouter from './admin/index.js';
import userRouter from './user/index.js';

const app = express();
app.enable('case sensitive routing');
app.enable('strict routing');

app.use(logger);
app.use(helmet());
app.use(strictRoutes);
hideDirectStatic(app);
app.use(compression());
app.use(express.static('public', { index: false, redirect: false }));
app.use(express.json());

app.use('/admin', adminRouter);
app.use('/', userRouter);

errorsHandle(app);

(async () => {
  await initStorage();

  try {
    await initDatabase();
  } catch(err) {
    console.log(err);
    process.exit(1);
  }
  console.log('Initialized database connection to', DB.config.filename);

  const servers = {};
  servers.appServer = createAppServer(app);
  servers.redirectServer = createRedirectServer();

  gracefulShutdown(servers);
})();