import Joi from 'joi';
import sharp from 'sharp';
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
  index: Joi.number().required().integer().min(0).max(4).messages({
    'any.required': 'Индекс не передан',
    'number.base': 'Индекс не является целым числом',
    'number.min': 'Передано неверное значение индекса',
    'number.max': 'Передано неверное значение индекса'
  }),
  question: Joi.string().required().trim().messages({
    'any.required': 'Вопрос не передан',
    'string.empty': 'Вопрос не может быть пустым'
  }),
  answer: Joi.string().required().trim().messages({
    'any.required': 'Ответ не передан',
    'string.empty': 'Ответ не может быть пустым'
  }),
  comment: Joi.string().allow('').required().trim().messages({
    'any.required': 'Комментарий не передан'
  })
}).unknown();

export const getQuestionsBySubjects = async subjectsIds => {
  return await DB.all(SQL`
    SELECT subject_id, "index", question_type, question, question_file, answer, comment
    FROM questions WHERE subject_id IN (`.append(subjectsIds.join(',')).append(SQL`)
    ORDER BY "index" ASC
  `));
};

export const getFilledQuestionsCountBySubject = async subjectId => {
  return (await DB.get(SQL`
    SELECT COUNT(subject_id) AS count FROM questions WHERE subject_id = ${subjectId} AND question_type IS NOT NULL
  `)).count;
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

  const question = await DB.get(SQL`
    SELECT question_type, question_file
    FROM questions WHERE subject_id = ${data.subject_id} AND "index" = ${data.index}
    LIMIT 1
  `);

  let deleteOldQuestionFile = false;
  data.question_file = null;

  if(data.question_type === 0) {
    deleteOldQuestionFile = true;
  } else {
    const file = files.find(f => f.fieldname === 'question_file');

    if(file) {
      let storageName;
      let storageFullName;
      do {
        storageName = randomString(32);
        storageFullName = `${storageName}.${QUESTIONS_TYPES_EXTENSIONS[data.question_type]}`;
      } while(await storageExists(storageFullName));

      if(data.question_type === 1) {
        file.buffer = await sharp(file.buffer)
          .resize({ width: 960, height: 960, fit: 'inside' })
          .png({ compressionLevel: 9 })
          .toBuffer()
      }

      await storageSave(storageFullName, file.buffer);
      data.question_file = storageName;

      deleteOldQuestionFile = true;
    } else if(data.question_type !== question.question_type) {
      return 'Не передан файл вопроса';
    } else {
      data.question_file = question.question_file;
    }
  }

  if(deleteOldQuestionFile && question.question_type > 0) {
    await storageDelete(
      `${question.question_file}.${QUESTIONS_TYPES_EXTENSIONS[question.question_type]}`
    );
  }

  await DB.run(SQL`
    UPDATE questions
    SET question_type = ${data.question_type}, question = ${data.question},
        question_file = ${data.question_file}, answer = ${data.answer},
        comment = ${data.comment}
    WHERE subject_id = ${data.subject_id} AND "index" = ${data.index}
  `);

  return true;
};