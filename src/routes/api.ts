import { Router } from 'express';
import pageRouter from './page';
import postRouter from './post';

// Export the base-router
const baseRouter = Router();

// Setup routers
baseRouter.use('/page', pageRouter);
baseRouter.use('/post', postRouter);

// Export default.
export default baseRouter;
