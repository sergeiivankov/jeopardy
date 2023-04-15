import Joi from 'joi';
import { QUESTIONS_TYPES_EXTENSIONS, ROUND_PRICES } from '../helpers/consts.js';
import { randomString } from '../helpers/common.js';
import { storageExists, storageSave, storageDelete } from '../helpers/storage.js';
import { validate } from '../helpers/validation.js';
import { getSubjectByIdAndGame } from './subject.js';

const schemaUpdate = Joi.object({
  subject_id: Joi.number().required().integer().greater(0).messages({
    'any.required': 'Идентификатор темы не передан',
    'number.base': 'Идентификатор темы не является целым числом',
    'number.greater': 'Идентификатор темы не может быть отрицательным'
  }),
  question_type: Joi.number().required().integer().min(0).max(3).messages({
    'any.required': 'Тип вопроса не передан',
    'number.base': 'Тип вопроса не является целым числом',
    'number.min': 'Передан неверный тип вопроса',
    'number.max': 'Передан неверный тип вопроса'
  }),
  answer_type: Joi.number().required().integer().min(0).max(3).messages({
    'any.required': 'Тип ответа не передан',
    'number.base': 'Тип ответа не является целым числом',
    'number.min': 'Передан неверный тип ответа',
    'number.max': 'Передан неверный тип ответа'
  }),
  index: Joi.number().required().integer().min(0).max(4).messages({
    'any.required': 'Индекс не передан',
    'number.base': 'Индекс не является целым числом',
    'number.min': 'Передано неверное значение индекса',
    'number.max': 'Передано неверное значение индекса'
  }),
  comment: Joi.string().allow('').required().trim().messages({
    'any.required': 'Комментарий не передан'
  })
}).unknown();

export const getQuestionsBySubjects = async subjectsIds => {
  return await DB.all(SQL`
    SELECT subject_id, "index", question_type, question, answer_type, answer, comment
    FROM questions WHERE subject_id IN (`.append(subjectsIds.join(',')).append(SQL`)
    ORDER BY "index" ASC
  `));
};

export const updateQuestion = async (gameId, data, files) => {
  data = validate(schemaUpdate, data);
  if(typeof(data) === 'string') return data;

  const subject = await getSubjectByIdAndGame(data.subject_id, gameId);
  if(!subject) return 'Тема с переданным идентификатором не найдена';

  if(data.index > ROUND_PRICES[subject.round].length - 1) {
    return 'Передано неверное значение индекса';
  }

  if(data.comment === '') data.comment = null;

  if(data.question_type === 0) {
    data.question = String(data.question).trim();
    if(data.question === '') return 'Вопрос не может быть пустым';
  } else {
    const file = files.find(f => f.fieldname === 'question');
    if(!file) return 'Не передан файл вопроса';

    let storageName;
    let storageFullName;
    do {
      storageName = randomString(32);
      storageFullName = `${storageName}.${QUESTIONS_TYPES_EXTENSIONS[data.question_type]}`;
    } while(await storageExists(storageFullName));

    await storageSave(storageFullName, file.buffer);
    data.question = storageName;
  }

  if(data.answer_type === 0) {
    data.answer = String(data.answer).trim();
    if(data.answer === '') return 'Ответ не может быть пустым';
  } else {
    const file = files.find(f => f.fieldname === 'answer');
    if(!file) return 'Не передан файл ответа';

    let storageName;
    let storageFullName;
    do {
      storageName = randomString(32);
      storageFullName = `${storageName}.${QUESTIONS_TYPES_EXTENSIONS[data.answer_type]}`;
    } while(await storageExists(storageFullName));

    await storageSave(storageFullName, file.buffer);
    data.answer = storageName;
  }

  const question = await DB.get(SQL`
    SELECT question_type, question, answer_type, answer
    FROM questions WHERE subject_id = ${data.subject_id} AND "index" = ${data.index}
    LIMIT 1
  `);
  if(question.question_type > 0) {
    await storageDelete(
      `${question.question}.${QUESTIONS_TYPES_EXTENSIONS[question.question_type]}`
    );
  }
  if(question.answer_type > 0) {
    await storageDelete(
      `${question.answer}.${QUESTIONS_TYPES_EXTENSIONS[question.answer_type]}`
    );
  }

  await DB.run(SQL`
    UPDATE questions
    SET question_type = ${data.question_type}, question = ${data.question},
        answer_type = ${data.answer_type}, answer = ${data.answer},
        comment = ${data.comment}
    WHERE subject_id = ${data.subject_id} AND "index" = ${data.index}
  `);

  return true;
};