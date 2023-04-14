export const getUserIdByToken = async token => {
  const user = await DB.get(SQL`SELECT id FROM users WHERE password = ${token} LIMIT 1`);
  return user?.id;
};

export const getAllUsers = async () => {
  return await DB.all('SELECT id, name, password FROM users ORDER BY name ASC');
};

export const createUser = async data => {
  if(!data.name) return 'Имя обязательно к заполнению';
  if(!data.password) return 'Пароль обязателен к заполнению';

  data.name = data.name.trim();
  data.password = data.password.trim();

  const userNameExists = await DB.get(SQL`SELECT id FROM users WHERE name = ${data.name} LIMIT 1`);
  if(userNameExists) return 'Пользователь с таким именем уже существует';

  const userPasswordExists = await DB.get(SQL`
    SELECT id FROM users WHERE password = ${data.password} LIMIT 1
  `);
  if(userPasswordExists) return 'Пользователь с таким паролем уже существует';

  await DB.run(SQL`INSERT INTO users (name, password) VALUES (${data.name}, ${data.password})`);

  return true;
};

export const updateUser = async data => {
  if(!data.id) return 'Не передан идентификатор пользователя';
  if(!data.name) return 'Имя обязательно к заполнению';
  if(!data.password) return 'Пароль обязателен к заполнению';

  data.name = data.name.trim();
  data.password = data.password.trim();

  const userExists = await DB.get(SQL`SELECT id FROM users WHERE id = ${data.id} LIMIT 1`);
  if(!userExists) return 'Пользователя с переданным идентификатором не существует';

  const userNameExists = await DB.get(SQL`
    SELECT id FROM users WHERE name = ${data.name} AND id != ${data.id} LIMIT 1
  `);
  if(userNameExists) return 'Пользователь с таким именем уже существует';

  const userPasswordExists = await DB.get(SQL`
    SELECT id FROM users WHERE password = ${data.password} AND id != ${data.id} LIMIT 1
  `);
  if(userPasswordExists) return 'Пользователь с таким паролем уже существует';

  await DB.run(SQL`
    UPDATE users SET name = ${data.name}, password = ${data.password} WHERE id = ${data.id}
  `);

  return true;
};

export const deleteUser = async id => {
  if(!id) return 'Не передан идентификатор пользователя';

  const userExists = await DB.get(SQL`SELECT id FROM users WHERE id = ${id} LIMIT 1`);
  if(!userExists) return 'Пользователя с переданным идентификатором не существует';

  await DB.run(SQL`DELETE FROM users WHERE id = ${id}`);

  return true;
};