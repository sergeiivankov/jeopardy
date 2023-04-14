import 'dotenv/config';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import { createAppServer, createRedirectServer } from './helpers/create-server.js';
import errorsHandle from './helpers/errors-handle.js';
import gracefulShutdown from './helpers/graceful-shutdown.js';
import hideDirectStatic from './helpers/hide-direct-static.js';
import logger from './helpers/logger.js';
import strictRoutes from './helpers/strict-routes.js';

const app = express();
app.enable('case sensitive routing');
app.enable('strict routing');

app.use(logger);
app.use(helmet());
app.use(strictRoutes);
hideDirectStatic(app);
app.use(compression());
app.use(express.static('public', { redirect: false }));

// ROUTES HERE

errorsHandle(app);

const servers = {};
servers.appServer = createAppServer(app);
servers.redirectServer = createRedirectServer();

gracefulShutdown(servers);