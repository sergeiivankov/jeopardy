import { MAX_ROUND_SUBJECTS_COUNT } from '../helpers/consts.js';

const checkMaxRoundSubjectsCount = async (gameId, round) => {
  const maxRoundSubjectsCount = MAX_ROUND_SUBJECTS_COUNT[round];

  const roundSubjectsCount = (await DB.get(SQL`
    SELECT COUNT(id) AS count FROM subjects
    WHERE game_id = ${gameId} AND round = ${round}
    LIMIT ${maxRoundSubjectsCount}
  `)).count;
  if(roundSubjectsCount === maxRoundSubjectsCount) {
    return 'Раунд уже содержит максимальное количество тем';
  }

  return true;
};

export const getSubjectsByGame = async gameId => {
  return await DB.all(SQL`SELECT id, round, name FROM subjects WHERE game_id = ${gameId}`);
};

export const createSubject = async (gameId, data) => {
  if(!Object.hasOwn(data, 'round')) return 'Не передан идентификатор раунда';
  if(!Object.hasOwn(data, 'name')) return 'Название обязательно к заполнению';

  data.round = parseInt(data.round, 10);
  data.name = data.name.trim();

  if(data.round < 0 || data.round > 6) return 'Неверный идентификатор раунда';

  const subjectNameExists = await DB.get(SQL`
    SELECT id FROM subjects
    WHERE game_id = ${gameId} AND round = ${data.round} AND name = ${data.name}
    LIMIT 1
  `);
  if(subjectNameExists) return 'Тема с таким названием уже существует в текущем раунде';

  const maxRoundSubjectsCountResult = await checkMaxRoundSubjectsCount(gameId, data.round);
  if(maxRoundSubjectsCountResult !== true) return maxRoundSubjectsCountResult;

  await DB.run(SQL`
    INSERT INTO subjects (game_id, round, name) VALUES (${gameId}, ${data.round}, ${data.name})
  `);

  return true;
};

export const updateSubject = async (gameId, data) => {
  if(!Object.hasOwn(data, 'id')) return 'Не передан идентификатор темы';
  if(!Object.hasOwn(data, 'round')) return 'Не передан идентификатор раунда';
  if(!Object.hasOwn(data, 'name')) return 'Название обязательно к заполнению';

  data.id = parseInt(data.id, 10);
  data.round = parseInt(data.round, 10);
  data.name = data.name.trim();

  if(data.round < 0 || data.round > 6) return 'Неверный идентификатор раунда';

  const subjectNameExists = await DB.get(SQL`
    SELECT id FROM subjects
    WHERE game_id = ${gameId} AND round = ${data.round} AND name = ${data.name} AND id != ${data.id}
    LIMIT 1
  `);
  if(subjectNameExists) return 'Тема с таким названием уже существует в текущем раунде';

  const maxRoundSubjectsCountResult = await checkMaxRoundSubjectsCount(gameId, data.round);
  if(maxRoundSubjectsCountResult !== true) return maxRoundSubjectsCountResult;

  await DB.run(SQL`
    UPDATE subjects
    SET round = ${data.round}, name = ${data.name}
    WHERE id = ${data.id} AND game_id = ${gameId}
  `);

  return true;
};

export const deleteSubject = async (gameId, id) => {
  if(!id) return 'Не передан идентификатор темы';

  await DB.run(SQL`DELETE FROM subjects WHERE id = ${id} AND game_id = ${gameId}`);

  // TODO:
  // - delete subject questions
  // - delete subject questions resouces (images, audios, videos)

  return true;
};