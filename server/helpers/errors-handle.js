import { sendHtmlFile, sendNotFound } from './common.js';

export default app => {
  app.use(sendNotFound);

  app.use((err, req, res, next) => {
    console.error(err);

    res.status(500);
    sendHtmlFile('500', res);
  });
};