import { Router } from 'express';
import { getPostList } from 'src/controllers/postsController';

// Constants
const router = Router();

router.get('/:page', getPostList);

export default router;
