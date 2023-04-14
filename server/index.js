import compression from 'compression';
import * as dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import errorsHandle from './helpers/errors-handle.js';
import gracefulShutdown from './helpers/graceful-shutdown.js';
import strictRoutes from './helpers/strict-routes.js';

dotenv.config();

const app = express();
app.enable('case sensitive routing');
app.enable('strict routing');

app.use(morgan('[:date[iso]] :remote-addr :method :url :status :response-time[3]ms :user-agent'));
app.use(helmet());
app.use(strictRoutes);
app.use(compression());
app.use(express.static('public', { redirect: false }));

// ROUTES HERE

errorsHandle(app);

const port = parseInt(process.env.JEOPARDY_PORT, 10);
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
server.setTimeout(15000);

gracefulShutdown(server);