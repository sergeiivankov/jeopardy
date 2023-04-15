export const checkGameOwner = async (ownerId, id) => {
  const gameExists = await DB.get(SQL`
    SELECT id FROM games WHERE id = ${id} AND owner_id = ${ownerId} LIMIT 1
  `);
  if(!gameExists) return 'Игры с переданным идентификатором не существует';

  return true;
};

export const getGames = async ownerId => {
  return await DB.all(SQL`SELECT id, name, announced FROM games WHERE owner_id = ${ownerId}`);
};

export const getGame = async (ownerId, id) => {
  const checkOwner = await checkGameOwner(ownerId, id);
  if(checkOwner !== true) return checkOwner;

  return await DB.get(SQL`
    SELECT id, name FROM games WHERE id = ${id} AND owner_id = ${ownerId} LIMIT 1
  `);
};

export const createGame = async (ownerId, data) => {
  if(!Object.hasOwn(data, 'name')) return 'Название обязательно к заполнению';

  data.name = data.name.trim();
  if(data.name === '') return 'Название обязательно к заполнению';

  const gameNameExists = await DB.get(SQL`
    SELECT id FROM games WHERE owner_id = ${ownerId} AND name = ${data.name} LIMIT 1
  `);
  if(gameNameExists) return 'Игра с таким названием уже существует';

  await DB.run(SQL`
    INSERT INTO games (owner_id, name, announced) VALUES (${ownerId}, ${data.name}, 0)
  `);

  return true;
};

export const updateGame = async (ownerId, data) => {
  if(!Object.hasOwn(data, 'id')) return 'Не передан идентификатор игры';
  if(!Object.hasOwn(data, 'name')) return 'Название обязательно к заполнению';

  data.id = parseInt(data.id, 10);
  data.name = data.name.trim();
  if(data.name === '') return 'Название обязательно к заполнению';

  const checkOwner = await checkGameOwner(ownerId, data.id);
  if(checkOwner !== true) return checkOwner;

  const gameNameExists = await DB.get(SQL`
    SELECT id FROM games
    WHERE owner_id = ${ownerId} AND name = ${data.name} AND id != ${data.id}
    LIMIT 1
  `);
  if(gameNameExists) return 'Игра с таким названием уже существует';

  await DB.run(SQL`UPDATE games SET name = ${data.name} WHERE id = ${data.id}`);

  return true;
};

export const deleteGame = async (ownerId, id) => {
  if(!id) return 'Не передан идентификатор игры';

  const checkOwner = await checkGameOwner(ownerId, id);
  if(checkOwner !== true) return checkOwner;

  await DB.run(SQL`DELETE FROM subjects WHERE game_id = ${gameId}`);
  await DB.run(SQL`DELETE FROM games WHERE id = ${id}`);

  // TODO:
  // - not delete announced games
  // - delete game questions
  // - delete game questions resouces (images, audios, videos)

  return true;
};