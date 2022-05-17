import { Router } from 'express';
import { getPage } from 'src/controllers/pageController';

// Constants
const router = Router();

router.get('/:page', getPage);

export default router;
