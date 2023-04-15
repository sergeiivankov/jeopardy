import { sendHtmlFile, sendNotFound } from './common.js';

export default app => {
  app.use(sendNotFound);

  app.use((err, req, res, next) => {
    console.error(err);

    res.status(500);

    if(req.get('Content-Type') === 'application/json') {
      res.json({ ok: false, err: 'Серверная ошибка' });
    }
    else sendHtmlFile('500', res);
  });
};