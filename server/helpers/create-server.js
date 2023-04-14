import { readFileSync } from 'fs';
import { createServer as createServerHttp } from 'http';
import { createServer as createServerHttps } from 'https';

const port = parseInt(process.env.JEOPARDY_PORT, 10) || 3000;
const timeout = (parseInt(process.env.JEOPARDY_REQUEST_TIMEOUT, 10) || 30) * 1000;

const listenServer = (server, port, message) => {
  server.setTimeout(timeout);
  server.listen(port, () => console.log(message));
};

export const createAppServer = app => {
  let server;

  if(process.env.JEOPARDY_SECURE_CERT) {
    const cert = readFileSync(process.env.JEOPARDY_SECURE_CERT, 'utf8');
    const key = readFileSync(process.env.JEOPARDY_SECURE_KEY, 'utf8');

    server = createServerHttps({ cert, key }, app);
  } else {
    server = createServerHttp(app);
  }

  listenServer(server, port, `Server listening on port ${port}`);

  return server;
};

export const createRedirectServer = () => {
  if(!process.env.JEOPARDY_HTTPS_REDIRECT_SERVER) return;

  const httpsRedirectServer = createServerHttp((req, res) => {
    const url = new URL(req.url, `https://${req.headers.host}`);
    res.writeHead(301, { 'Location': url.toString() }).end();
  });

  listenServer(httpsRedirectServer, 80, 'HTTPS redirect server listening on port 80');

  return httpsRedirectServer;
};