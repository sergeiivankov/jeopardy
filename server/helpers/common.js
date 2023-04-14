import { dirname } from 'path';
import { fileURLToPath } from 'url';

const publicRoot = dirname(fileURLToPath(import.meta.url)) + '/../../public/';

export const sendHtmlFile = (name, res) => {
  res.sendFile(name + '.html', { root: publicRoot });
};

export const sendNotFound = (req, res) => {
  res.status(404);
  sendHtmlFile('404', res);
};