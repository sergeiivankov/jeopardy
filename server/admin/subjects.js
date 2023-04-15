import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { handleBoolResult } from '../helpers/common.js';
import { checkGameOwner } from '../models/game.js';
import { createSubject, updateSubject, deleteSubject } from '../models/subject.js';

const subrouter = Router({ mergeParams: true });

subrouter.use(asyncHandler(async (req, res, next) => {
  res.locals.gameId = parseInt(req.params.gameId, 10);

  const checkOwner = await checkGameOwner(res.locals.userId, res.locals.gameId);
  if(checkOwner !== true) return res.json({ ok: false, err: checkOwner });

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