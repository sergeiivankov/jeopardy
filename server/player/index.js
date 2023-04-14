import { Router } from 'express';
import { sendHtmlFile } from '../helpers/common.js';

const router = Router();

router.get('/', (req, res) => {
  sendHtmlFile('index', res);
});

export default router;