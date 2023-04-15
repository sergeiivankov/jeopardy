import Joi from 'joi';
import { MAX_ROUND_SUBJECTS_COUNT } from '../helpers/consts.js';
import { validate, ruleId, ruleName } from '../helpers/validation.js';

const schemaCreate = Joi.object(ruleName).append({
  round: Joi.number().required().integer().min(0).max(6).messages({
    'any.required': 'Идентификатор раунда не передан',
    'number.base': 'Идентификатор раунда не является целым числом',
    'number.min': 'Неверный идентификатор раунда',
    'number.max': 'Неверный идентификатор раунда'
  })
});
const schemaUpdate = schemaCreate.append(ruleId);

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
  data = validate(schemaCreate, data);
  if(typeof(data) === 'string') return data;

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
  data = validate(schemaUpdate, data);
  if(typeof(data) === 'string') return data;

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