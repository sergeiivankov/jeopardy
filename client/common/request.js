import { writable } from 'svelte/store';
import { token } from './auth.js';

let baseURL = '';

export let loadingTimes = writable(0);

export const setBaseURL = value => baseURL = value;

const request = async (method, path, body = null, alertUnauthorized = true) => {
  loadingTimes.update(n => n + 1);

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
      loadingTimes.update(n => n - 1);
      return null;
    }

    if(response.status === 404) {
      alert('Адрес запроса не найден');
      loadingTimes.update(n => n - 1);
      return null;
    }

    if(response.status === 500) {
      alert('Серверная ошибка');
      loadingTimes.update(n => n - 1);
      return null;
    }

    const data = await response.json();

    if(!data.ok) {
      alert(data.err);
      loadingTimes.update(n => n - 1);
      return null;
    }

    loadingTimes.update(n => n - 1);
    return data.res;
  } catch(err) {
    alert('Ошибка: ' + JSON.stringify(err));
    loadingTimes.update(n => n - 1);
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