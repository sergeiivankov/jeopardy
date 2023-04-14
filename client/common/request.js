import { token } from './auth.js';

let baseURL = '';

export const setBaseURL = value => baseURL = value;

const request = async (method, path, body = null, alertUnauthorized = true) => {
  try {
    const options = {};
    options.method = method;
    options.headers = { Authorization: token };
    if(body !== null) {
      options.headers['Content-Type'] = 'application/json';
      options.body = body;
    }

    const response = await fetch(baseURL + path, options);

    if(response.status === 401) {
      if(alertUnauthorized) alert('Ошибка авторизации');
      return null;
    }

    if(response.status === 404) {
      alert('Адрес запроса не найден');
      return null;
    }

    if(response.status === 500) {
      alert('Серверная ошибка');
      return null;
    }

    const data = await response.json();

    if(!data.ok) {
      alert(data.err);
      return null;
    }

    return data.res;
  } catch(err) {
    alert('Ошибка: ' + JSON.stringify(err));
    return null;
  }
};

export const get = async (path, alertUnauthorized = true) => {
  return await request('GET', path, null, alertUnauthorized);
};

export const post = async (path, body) => {
  return await request('POST', path, JSON.stringify(body));
};

export const put = async (path, body) => {
  return await request('PUT', path, JSON.stringify(body));
};

export const del = async path => {
  return await request('DELETE', path);
};