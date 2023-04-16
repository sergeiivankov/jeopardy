import Joi from 'joi';
import { validate, ruleId, ruleName } from '../helpers/validation.js';
import { getSubjectsByGame, deleteSubject } from './subject.js';

const schemaCreate = Joi.object(ruleName);
const schemaUpdate = schemaCreate.append(ruleId);

export const checkGameOwner = async (ownerId, id) => {
  const gameExists = await DB.get(SQL`
    SELECT id FROM games WHERE id = ${id} AND owner_id = ${ownerId} LIMIT 1
  `);
  if(!gameExists) return 'Игры с переданным идентификатором не существует';

  return true;
};

export const getGames = async ownerId => {
  return await DB.all(SQL`
    SELECT G.id, G.name, G.announced, IFNULL(GROUP_CONCAT(GP.user_id), '') AS users FROM games AS G
    LEFT JOIN games_participants AS GP ON G.id = GP.game_id
    WHERE G.owner_id = ${ownerId}
    GROUP BY G.id
  `);
};

export const getGame = async (ownerId, id) => {
  const checkOwner = await checkGameOwner(ownerId, id);
  if(checkOwner !== true) return checkOwner;

  return await DB.get(SQL`
    SELECT id, name FROM games WHERE id = ${id} AND owner_id = ${ownerId} LIMIT 1
  `);
};

export const createGame = async (ownerId, data) => {
  data = validate(schemaCreate, data);
  if(typeof(data) === 'string') return data;

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
  data = validate(schemaUpdate, data);
  if(typeof(data) === 'string') return data;

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

export const toggleGameAnnounced = async (ownerId, id) => {
  if(!id) return 'Не передан идентификатор игры';

  const checkOwner = await checkGameOwner(ownerId, id);
  if(checkOwner !== true) return checkOwner;

  const game = await DB.get(SQL`SELECT announced FROM games WHERE id = ${id} LIMIT 1`);

  await DB.run(SQL`UPDATE games SET announced = ${game.announced ? 0 : 1} WHERE id = ${id}`);

  return true;
};

export const setGameParcipants = async (ownerId, id, data) => {
  if(!id) return 'Не передан идентификатор игры';
  if(!data.users || !Array.isArray(data.users)) return 'Не переданы идентификаторы игроков';

  data.users = data.users.map(id => parseInt(id, 10)).filter(id => Number.isInteger(id) && id > 0);

  const checkOwner = await checkGameOwner(ownerId, id);
  if(checkOwner !== true) return checkOwner;

  await DB.run(SQL`DELETE FROM games_participants WHERE game_id = ${id}`);

  if(data.users.length) {
    const participantsStmt = SQL`INSERT INTO games_participants (game_id, user_id) VALUES`;

    for(let i = 0, l = data.users.length; i < l; i++) {
      const userId = data.users[i];
      if(i === 0) participantsStmt.append(SQL` (${id}, ${userId})`);
      else participantsStmt.append(SQL`, (${id}, ${userId})`);
    }

    await DB.run(participantsStmt);
  }

  return true;
};

export const deleteGame = async (ownerId, id) => {
  if(!id) return 'Не передан идентификатор игры';

  const checkOwner = await checkGameOwner(ownerId, id);
  if(checkOwner !== true) return checkOwner;

  const subjects = await getSubjectsByGame(id);
  for(let subject of subjects) await deleteSubject(id, subject.id);

  await DB.run(SQL`DELETE FROM games WHERE id = ${id}`);

  // TODO: not delete announced games

  return true;
};