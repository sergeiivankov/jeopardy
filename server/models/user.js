import Joi from 'joi';
import { validate, ruleId } from '../helpers/validation.js';

const schemaCreate = Joi.object({
  name: Joi.string().required().trim().messages({
    'any.required': 'Имя не передано',
    'string.empty': 'Имя не может быть пустым',
  }),
  password: Joi.string().required().trim().min(8, 'utf8').messages({
    'any.required': 'Пароль не передан',
    'string.empty': 'Пароль не может быть короче 8 символов',
    'string.min': 'Пароль не может быть короче 8 символов',
  })
});
const schemaUpdate = schemaCreate.append(ruleId);

export const getUserIdByToken = async token => {
  const user = await DB.get(SQL`SELECT id FROM users WHERE password = ${token} LIMIT 1`);
  return user?.id;
};

export const getUsers = async () => {
  return await DB.all('SELECT id, name, password FROM users');
};

export const getUsersData = async () => {
  return await DB.all('SELECT id, name FROM users');
};

export const createUser = async data => {
  data = validate(schemaCreate, data);
  if(typeof(data) === 'string') return data;

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
  data = validate(schemaUpdate, data);
  if(typeof(data) === 'string') return data;

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