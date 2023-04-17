import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { sendHtmlFile } from '../helpers/common.js';
import { ROUND_PRICES, ROUND_NAMES } from '../helpers/consts.js';
import { getPlayerGames } from '../models/game.js';
import { getUserByToken } from '../models/user.js';

const router = Router();

router.get('/', (req, res) => {
  sendHtmlFile('index', res);
});

router.use(asyncHandler(async (req, res, next) => {
  const user = await getUserByToken(req.get('Authorization'));
  if(user) {
    res.locals.userId = user.id;
    res.locals.userName = user.name;
    return next();
  }

  res.sendStatus(401);
}));

router.get('/check', (req, res) => {
  res.json({ ok: true });
});

router.get('/data', asyncHandler(async (req, res) => {
  const data = { ROUND_PRICES, ROUND_NAMES };
  data.userId = res.locals.userId;
  data.userName = res.locals.userName;

  res.json({ ok: true, res: data });
}));

router.get('/games', asyncHandler(async (req, res) => {
  res.json({ ok: true, res: await getPlayerGames(res.locals.userId) });
}));

export default router;