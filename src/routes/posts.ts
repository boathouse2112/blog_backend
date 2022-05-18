import { Router } from 'express';
import { getPage, getYear } from 'src/controllers/pageController';
import { getPost } from 'src/controllers/postController';

// Constants
const router = Router();

router.get('/:slug', getPost);
router.get('/page/:page', getPage);
router.get('/year/:year/page/:page', getYear);
// router.get('/month/:year/:month/page/:page', getMonth);

export default router;
