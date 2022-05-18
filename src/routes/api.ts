import { Router } from 'express';
import postsRouter from './posts';

// Export the base-router
const baseRouter = Router();

// Setup routers
baseRouter.use('/posts', postsRouter);

// Export default.
export default baseRouter;
