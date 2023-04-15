import { Router } from 'express';
import multer from 'multer';
import asyncHandler from 'express-async-handler';
import { handleBoolResult } from '../helpers/common.js';
import { checkGameOwner } from '../models/game.js';
import { updateQuestion } from '../models/question.js';

const router = Router();

router.put('/:gameId(\\d+)', multer().any(), asyncHandler(async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);

  const checkOwner = await checkGameOwner(res.locals.userId, gameId);
  if(checkOwner !== true) return res.json({ ok: false, err: checkOwner });

  handleBoolResult(res, await updateQuestion(gameId, req.body, req.files));
}));

export default router;