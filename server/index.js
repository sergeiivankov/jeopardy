import compression from 'compression';
import * as dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();

app.use(compression());
app.use(express.static('public'));

const port = parseInt(process.env.JEOPARDY_PORT, 10);
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});