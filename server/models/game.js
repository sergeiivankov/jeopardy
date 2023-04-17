import Joi from 'joi';
import { REQUIRED_ROUND_SUBJECTS_COUNT, ROUND_NAMES } from '../helpers/consts.js';
import { validate, ruleId, ruleName } from '../helpers/validation.js';
import { getFilledQuestionsCountBySubject } from './question.js';
import { getSubjectsByGame, deleteSubject } from './subject.js';

const schemaCreate = Joi.object(ruleName);
const schemaUpdate = schemaCreate.append(ruleId).unknown();

export const getGames = async ownerId => {
  return await DB.all(SQL`
    SELECT G.id, G.name, G.announced, IFNULL(GROUP_CONCAT(GP.user_id), '') AS users FROM games AS G
    LEFT JOIN games_participants AS GP ON G.id = GP.game_id
    WHERE G.owner_id = ${ownerId}
    GROUP BY G.id
  `);
};

export const getGame = async (ownerId, id) => {
  const game = await DB.get(SQL`
    SELECT id, name, announced FROM games WHERE id = ${id} AND owner_id = ${ownerId} LIMIT 1
  `);
  if(!game) return 'Игры с переданным идентификатором не существует';

  return game;
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

  const game = await getGame(ownerId, data.id);
  if(typeof(game) === 'string') return game;
  if(game.announced === 1) return 'Нельзя изменять анонсированную игру';

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

  const game = await getGame(ownerId, id);
  if(typeof(game) === 'string') return game;

  if(game.announced === 0) {
    const subjects = await getSubjectsByGame(id);

    const roundsSubjectsCounts = [0, 0, 0, 0, 0, 0, 0];
    for(let subject of subjects) {
      roundsSubjectsCounts[subject.round]++;
    }

    const errors = [];

    for(let index in roundsSubjectsCounts) {
      if(roundsSubjectsCounts[index] < REQUIRED_ROUND_SUBJECTS_COUNT[index]) {
        errors.push(`${ROUND_NAMES[index]} содержит ${roundsSubjectsCounts[index]} из ${REQUIRED_ROUND_SUBJECTS_COUNT[index]} требуемых тем`);
      }
    }

    for(let subject of subjects) {
      const needQuestionCount = subject.round === 3 ? 1 : 5;
      const questionCount = await getFilledQuestionsCountBySubject(subject.id);

      if(questionCount < needQuestionCount) {
        errors.push(`В теме ${subject.name} есть незаполненные вопросы`);
      }
    }

    if(errors.length) return errors.join('\n');

    const players = await DB.all(SQL`
      SELECT U.id, U.name FROM games_participants AS GP
      LEFT JOIN users AS U ON U.id = GP.user_id
      WHERE GP.game_id = ${id}
    `);
    if(players.length < 2) return 'В игре должны быть минимум 2 игрока';

    const playersAssoc = {};
    for(let player of players) playersAssoc[player.id] = player.name;

    const initState = {
      round: 0,
      screen: 'pause',
      screenData: {},
      players: playersAssoc,
      activePlayer: players[Math.floor(Math.random() * players.length)].id
    };

    const availableQuestions = [];
    for(let roundIndex in roundsSubjectsCounts) {
      const subjectsCount = roundsSubjectsCounts[roundIndex];
      if(subjectsCount === 0) break;

      availableQuestions.push([]);

      for(let subjectIndex = 0; subjectIndex < subjectsCount; subjectIndex++) {
        const needQuestionCount = roundIndex === '3' ? 1 : 5;
        availableQuestions[roundIndex].push( Array(needQuestionCount).fill(1))
      }
    }

    initState.availableQuestions = availableQuestions;

    await DB.run(SQL`
      UPDATE games SET announced = 1, state = ${JSON.stringify(initState)} WHERE id = ${id}
    `);
  } else {
    await DB.run(SQL`UPDATE games SET announced = 0, state = NULL WHERE id = ${id}`);
  }



  return true;
};

export const setGameParcipants = async (ownerId, id, data) => {
  if(!id) return 'Не передан идентификатор игры';
  if(!data.users || !Array.isArray(data.users)) return 'Не переданы идентификаторы игроков';

  data.users = data.users.map(id => parseInt(id, 10)).filter(id => Number.isInteger(id) && id > 0);
  if(data.users.includes(ownerId)) return 'Нельзя добавить себя в игру';

  const game = await getGame(ownerId, id);
  if(typeof(game) === 'string') return game;
  if(game.announced === 1) return 'Нельзя изменять анонсированную игру';

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

  const game = await getGame(ownerId, id);
  if(typeof(game) === 'string') return game;
  if(game.announced === 1) return 'Нельзя изменять анонсированную игру';

  const subjects = await getSubjectsByGame(id);
  for(let subject of subjects) await deleteSubject(id, subject.id);

  await DB.run(SQL`DELETE FROM games WHERE id = ${id}`);

  // TODO: not delete announced games

  return true;
};