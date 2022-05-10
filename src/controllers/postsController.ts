import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

const { OK } = StatusCodes;

const jsonSuccess = (data: Record<string, unknown>) => ({
  status: 'success',
  data,
});

const jsonFail = (failMessage: string) => ({
  status: 'fail',
  data: { posts: failMessage },
});

const isNumber = (value: string) => /^-?\d+$/.test(value);

const getPostList = async (req: Request, res: Response, next: NextFunction) => {
  const startParam = req.params.start; // Post to start at, zero-indexed
  const limitParam = req.params.limit; // Number of pages to return

  // If startParam is undefined, set to 0. If it can't be parsed to a number, return "fail"
  let start;
  if (startParam === undefined) {
    start = 0;
  } else if (!isNumber(startParam)) {
    return res.status(OK).json(jsonFail('invalid `start` parameter'));
  } else {
    start = parseInt(startParam, 10);
  }

  // Ditto limitParam, but default to 5
  let limit;
  if (limitParam === undefined) {
    limit = 5;
  } else if (!isNumber(limitParam)) {
    return res.status(OK).json(jsonFail('invalid `limit` parameter'));
  } else {
    limit = parseInt(startParam, 10);
  }

  // Create links to the next and previous page of results, if they exist.
  let previousPageLink;
  // A previous page exists if we can go back `n = limit` posts, and still have `start >= 0`
  if (start - limit >= 0) {
    previousPageLink = `${req.hostname}/posts?start=${
      start - limit
    }&limit=${limit}`;
  }

  let nextPageLink;
  // A next page exists if there are more than `n = start + limit` posts in the database
  if ((await prisma.post.count()) > start + limit) {
    nextPageLink = `${req.hostname}/posts?start=${
      start + limit
    }&limit=${limit}`;
  }

  // Get the nth page of posts from the db
  const posts = await prisma.post.findMany({
    orderBy: [{ created: 'desc' }],
    skip: start,
    take: limit,
  });

  // Return page links if they exist, and a list of posts
  return res.status(OK).json(
    jsonSuccess({
      _links: {
        ...(previousPageLink ? { previous: previousPageLink } : undefined),
        ...(nextPageLink ? { next: previousPageLink } : undefined),
      },
      posts: posts,
    })
  );
};

export { getPostList };
