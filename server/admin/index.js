import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { sendHtmlFile } from '../helpers/common.js';
import { getUserIdByToken } from '../models/user.js';

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

export default router;