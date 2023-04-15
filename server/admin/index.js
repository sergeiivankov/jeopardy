import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { sendHtmlFile, sendNotFound } from '../helpers/common.js';
import {
  MAX_ROUND_SUBJECTS_COUNT, QUESTIONS_TYPES_EXTENSIONS, REQUIRED_ROUND_SUBJECTS_COUNT, ROUND_PRICES
} from '../helpers/consts.js';
import { getUserIdByToken } from '../models/user.js';

import gamesRouter from './games.js';
import questionsRouter from './questions.js';
import subjectsRouter from './subjects.js';
import usersRouter from './users.js';

const router = Router();

router.get('/', (req, res) => {
  sendHtmlFile('admin', res);
});

router.use(asyncHandler(async (req, res, next) => {
  const token = req.get('Authorization');

  if(token === process.env.JEOPARDY_ADMIN_PASSWORD) {
    res.locals.userId = 0;
    return next();
  }

  const userId = await getUserIdByToken(token);
  if(userId) {
    res.locals.userId = userId;
    return next();
  }

  res.sendStatus(401);
}));

router.get('/check', (req, res) => {
  res.json({ ok: true, res: res.locals.userId === 0 });
});

router.get('/data', (req, res) => {
  const data = {
    MAX_ROUND_SUBJECTS_COUNT, QUESTIONS_TYPES_EXTENSIONS,
    REQUIRED_ROUND_SUBJECTS_COUNT, ROUND_PRICES
  };
  res.json({ ok: true, res: data });
});

router.use('/games', gamesRouter);
router.use('/questions', questionsRouter);
router.use('/subjects', subjectsRouter);
router.use('/users', usersRouter);

router.use(sendNotFound);

export default router;