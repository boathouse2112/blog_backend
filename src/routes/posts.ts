import { Router } from 'express';
import {
  getDay,
  getMonth,
  getPage,
  getYear,
} from 'src/controllers/pageController';
import {
  deletePost,
  getPost,
  postPost,
  updatePost,
} from 'src/controllers/postController';

// Constants
const router = Router();

router.get('/:slug', getPost);
router.get('/page/:page', getPage);
router.get('/year/:year/page/:page', getYear);
router.get('/month/:year/:month/page/:page', getMonth);
router.get('/day/:year/:month/:day/page/:page', getDay);

router.post('/:slug', postPost);

router.put('/:slug', updatePost);

router.delete('/:slug', deletePost);

export default router;
