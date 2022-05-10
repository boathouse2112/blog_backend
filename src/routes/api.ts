import { Router } from 'express';
import postsRouter from './posts';
import userRouter from './user-router';

// Export the base-router
const baseRouter = Router();

// Setup routers
baseRouter.use('/posts', postsRouter);
baseRouter.use('/users', userRouter);

// Export default.
export default baseRouter;
