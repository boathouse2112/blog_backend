import { Router } from 'express';
import { getPost } from 'src/controllers/postController';

// Constants
const router = Router();

router.get('/:slug', getPost);

export default router;
