import { writable } from 'svelte/store';

export let token = localStorage.token;
export let isAdmin = writable(false);

export const setToken = value => {
  token = value;

  if(!value) delete(localStorage.token);
  else localStorage.token = value;
};

export const setIsAdmin = value => {
  isAdmin.set(value);
};