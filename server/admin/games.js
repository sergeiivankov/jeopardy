import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { handleBoolResult } from '../helpers/common.js';
import { getGames, getGame, createGame, updateGame, deleteGame } from '../models/game.js';
import { getSubjectsByGame } from '../models/subject.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, res: await getGames(res.locals.userId) });
}));

router.get('/:id(\\d+)', asyncHandler(async (req, res) => {
  const gameId = parseInt(req.params.id, 10);

  const game = await getGame(res.locals.userId, gameId);
  if(typeof(game) === 'string') return res.json({ ok: false, err: game });

  game.subjects = await getSubjectsByGame(gameId);

  res.json({ ok: true, res: game });
}));

router.post('/', asyncHandler(async (req, res) => {
  handleBoolResult(res, await createGame(res.locals.userId, req.body));
}));

router.put('/', asyncHandler(async (req, res) => {
  handleBoolResult(res, await updateGame(res.locals.userId, req.body));
}));

router.delete('/:id(\\d+)', asyncHandler(async (req, res) => {
  handleBoolResult(res, await deleteGame(res.locals.userId, parseInt(req.params.id, 10)));
}));

export default router;