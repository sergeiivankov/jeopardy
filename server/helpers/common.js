import { dirname } from 'path';
import { fileURLToPath } from 'url';

const publicRoot = dirname(fileURLToPath(import.meta.url)) + '/../../public/';

export const sendHtmlFile = (name, res) => {
  res.sendFile(name + '.html', { root: publicRoot });
};

export const sendNotFound = (req, res) => {
  res.status(404);

  if(req.get('Content-Type') === 'application/json') {
    res.json({ ok: false, err: 'Адрес запроса не найден' });
  }
  else sendHtmlFile('404', res);
};

export const handleBoolResult = (res, result) => {
  const response = { ok: result === true };
  if(result === true) response.res = true;
  else response.err = result;
  res.json(response);
};

const randomCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
const randomCharactersLength = randomCharacters.length;

export const randomString = length => {
  let result = '';

  let counter = 0;
  while (counter < length) {
    result += randomCharacters.charAt(Math.floor(Math.random() * randomCharactersLength));
    counter += 1;
  }

  return result;
};