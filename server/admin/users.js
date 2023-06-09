import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { handleBoolResult } from '../helpers/common.js';
import { getUsers, createUser, updateUser, deleteUser } from '../models/user.js';

const router = Router();

router.use((req, res, next) => {
  if(res.locals.userId !== 0) res.sendStatus(401);
  else next();
});

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ok: true, res: await getUsers() });
}));

router.post('/', asyncHandler(async (req, res) => {
  handleBoolResult(res, await createUser(req.body));
}));

router.put('/', asyncHandler(async (req, res) => {
  handleBoolResult(res, await updateUser(req.body));
}));

router.delete('/:id(\\d+)', asyncHandler(async (req, res) => {
  handleBoolResult(res, await deleteUser(parseInt(req.params.id, 10)));
}));

export default router;