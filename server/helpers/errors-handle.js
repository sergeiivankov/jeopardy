import { dirname } from 'path';
import { fileURLToPath } from 'url';

const publicRoot = dirname(fileURLToPath(import.meta.url)) + '/../../public/';

const sendHtmlFile = (name, res) => {
  res.sendFile(name + '.html', { root: publicRoot });
};

export default app => {
  app.use((req, res) => {
    res.status(404);
    sendHtmlFile('404', res);
  });

  app.use((err, req, res, next) => {
    console.error(err);

    res.status(500);
    sendHtmlFile('500', res);
  });
};