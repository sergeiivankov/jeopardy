import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { handleBoolResult } from '../helpers/common.js';
import { getGames, createGame, updateGame, deleteGame } from '../models/game.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, res: await getGames(res.locals.userId) });
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