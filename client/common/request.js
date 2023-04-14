import { token } from './token.js';

let baseURL = '';

export const setBaseURL = value => baseURL = value;

export const get = async (path, alertUnauthorized = true) => {
  try {
    const response = await fetch(baseURL + path, {
      headers: {
        Authorization: token
      }
    });

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

    return await response.json();
  } catch(err) {
    alert('Ошибка: ' + JSON.stringify(err));
    return null;
  }
};