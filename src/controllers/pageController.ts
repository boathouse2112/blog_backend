import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { isNumber, jsonFail, jsonSuccess } from 'src/util/functions';

const POSTS_PER_PAGE = 5;

const prisma = new PrismaClient();
const { OK } = StatusCodes;

/**
 * Gets a single page of posts.
 * Returns `n = POSTS_PER_PAGE` posts.
 *
 * @param page The page of posts to get. Starts at page 1.
 * @returns
 */
const getPage = async (req: Request, res: Response): Promise<void> => {
  const { page: pageParam } = req.params;

  if (typeof pageParam !== 'string' || !isNumber(pageParam)) {
    res.status(OK).json(jsonFail('invalid `page` parameter'));
    return;
  }

  const page = parseInt(pageParam, 10);

  // Row where we start the query.
  // Pages are 1-indexed, but start should be 0-indexed.
  const start = (page - 1) * POSTS_PER_PAGE;

  const postCount = await prisma.post.count();
  const numberOfPages = Math.ceil(postCount / POSTS_PER_PAGE);

  const posts = await prisma.post.findMany({
    orderBy: [{ created: 'desc' }],
    skip: start,
    take: POSTS_PER_PAGE,
  });

  res.status(OK).json(
    jsonSuccess({
      numberOfPages,
      posts: posts,
    })
  );
};

export { getPage };
