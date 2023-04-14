import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { getAllUsers, createUser, updateUser, deleteUser } from '../models/user.js';

const router = Router();

router.use((req, res, next) => {
  if(res.locals.userId !== 0) res.sendStatus(401);
  else next();
});

router.get('/', asyncHandler(async (req, res) => {
  const users = await getAllUsers();
  res.json({ ok: true, res: users });
}));

router.post('/', asyncHandler(async (req, res) => {
  const result = await createUser(req.body);

  const response = { ok: result === true };
  if(result !== true) response.err = result;

  res.json(response);
}));

router.put('/', asyncHandler(async (req, res) => {
  const result = await updateUser(req.body);

  const response = { ok: result === true };
  if(result !== true) response.err = result;

  res.json(response);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await deleteUser(parseInt(req.params.id, 10));

  const response = { ok: result === true };
  if(result !== true) response.err = result;

  res.json(response);
}));

export default router;