import { sendNotFound } from './common.js';

export default app => {
  app.use(['/index.html', '/admin.html', '/404.html', '/500.html'], sendNotFound);
};