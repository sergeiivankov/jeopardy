import compression from 'compression';
import * as dotenv from 'dotenv';
import express from 'express';
import { readFileSync } from 'fs';
import helmet from 'helmet';
import { createServer as createServerHttp } from 'http';
import { createServer as createServerHttps } from 'https';
import errorsHandle from './helpers/errors-handle.js';
import gracefulShutdown from './helpers/graceful-shutdown.js';
import logger from './helpers/logger.js';
import strictRoutes from './helpers/strict-routes.js';

dotenv.config();

const app = express();
app.enable('case sensitive routing');
app.enable('strict routing');

app.use(logger());
app.use(helmet());
app.use(strictRoutes);
app.use(compression());
app.use(express.static('public', { redirect: false }));

// ROUTES HERE

errorsHandle(app);

const port = parseInt(process.env.JEOPARDY_PORT, 10);

let server;

if(process.env.JEOPARDY_SECURE_CERT) {
  const cert = readFileSync(process.env.JEOPARDY_SECURE_CERT, 'utf8');
  const key = readFileSync(process.env.JEOPARDY_SECURE_KEY, 'utf8');

  server = createServerHttps({ cert, key }, app);
} else {
  server = createServerHttp(app);
}

server.setTimeout(15000);
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

gracefulShutdown(server);