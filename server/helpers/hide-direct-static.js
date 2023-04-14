import { sendNotFound } from './common.js';

export default app => {
  app.use(['/404.html', '/500.html', '/admin.html', '/index.html' ], sendNotFound);
};