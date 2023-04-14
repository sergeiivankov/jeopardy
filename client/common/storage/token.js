export let token = localStorage.token;

export const setToken = value => {
  token = value;

  if(!value) delete(localStorage.token);
  else localStorage.token = value;
};