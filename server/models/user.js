export const getUserIdByToken = async token => {
  const user = await DB.get(SQL`SELECT id FROM users WHERE password = ${token} LIMIT 1`);
  return user?.id;
};