import compression from 'compression';
import * as dotenv from 'dotenv';
import express from 'express';
import strictRoutes from './helpers/strict-routes.js';

dotenv.config();

const app = express();
app.enable('case sensitive routing');
app.enable('strict routing');

app.use(strictRoutes);
app.use(compression());
app.use(express.static('public'));

const port = parseInt(process.env.JEOPARDY_PORT, 10);
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});