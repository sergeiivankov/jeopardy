import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { handleBoolResult } from '../helpers/common.js';
import { getGame } from '../models/game.js';
import { createSubject, updateSubject, deleteSubject } from '../models/subject.js';

const subrouter = Router({ mergeParams: true });

subrouter.use(asyncHandler(async (req, res, next) => {
  res.locals.gameId = parseInt(req.params.gameId, 10);

  const game = await getGame(res.locals.userId, res.locals.gameId);
  if(typeof(game) === 'string') return res.json({ ok: false, err: checkOwner });

  if(game.announced === 1) {
    return res.json({ ok: false, err: 'Нельзя изменять анонсированную игру' });
  }

  next();
}));

subrouter.post('/', asyncHandler(async (req, res) => {
  handleBoolResult(res, await createSubject(res.locals.gameId, req.body));
}));

subrouter.put('/', asyncHandler(async (req, res) => {
  handleBoolResult(res, await updateSubject(res.locals.gameId, req.body));
}));

subrouter.delete('/:id(\\d+)', asyncHandler(async (req, res) => {
  handleBoolResult(res, await deleteSubject(res.locals.gameId, parseInt(req.params.id, 10)));
}));

const router = Router();
router.use('/:gameId(\\d+)', subrouter);

export default router;