import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { sendHtmlFile } from '../helpers/common.js';
import { getUserIdByToken } from '../models/user.js';

const router = Router();

router.get('/', (req, res) => {
  sendHtmlFile('index', res);
});

router.use(asyncHandler(async (req, res, next) => {
  const userId = await getUserIdByToken(req.get('Authorization'));
  if(userId) {
    res.locals.userId = userId;
    return next();
  }

  res.sendStatus(401);
}));

router.get('/check', (req, res) => {
  res.json({ success: true });
});

export default router;