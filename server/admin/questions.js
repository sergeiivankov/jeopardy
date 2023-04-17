import { Router } from 'express';
import multer from 'multer';
import asyncHandler from 'express-async-handler';
import { handleBoolResult } from '../helpers/common.js';
import { getGame } from '../models/game.js';
import { updateQuestion } from '../models/question.js';

const router = Router();

router.put('/:gameId(\\d+)', multer().any(), asyncHandler(async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);

  const game = await getGame(res.locals.userId, gameId);
  if(typeof(game) === 'string') return res.json({ ok: false, err: checkOwner });

  if(game.announced === 1) {
    return res.json({ ok: false, err: 'Нельзя изменять анонсированную игру' });
  }

  handleBoolResult(res, await updateQuestion(gameId, req.body, req.files));
}));

export default router;