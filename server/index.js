import compression from 'compression';
import * as dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import strictRoutes from './helpers/strict-routes.js';

dotenv.config();

const app = express();
app.enable('case sensitive routing');
app.enable('strict routing');

app.use(helmet());
app.use(strictRoutes);
app.use(compression());
app.use(express.static('public', { redirect: false }));

const port = parseInt(process.env.JEOPARDY_PORT, 10);
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed')
  });
});