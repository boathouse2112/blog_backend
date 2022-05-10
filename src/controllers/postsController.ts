/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Post, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const postURL = (post: Post, hostname: string) => {
  const date = post.created;
  const year = date.getFullYear;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${hostname}/${year}/${month}/${day}`;
};

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

const getPostList = async (req: Request, res: Response) => {
  const startParam = req.query.start; // Post to start at, zero-indexed
  const limitParam = req.query.limit; // Number of pages to return

  // If startParam is undefined, set to 0. If it can't be parsed to a number, return "fail"
  let start;
  if (startParam === undefined) {
    start = 0;
  } else if (typeof startParam !== 'string' || !isNumber(startParam)) {
    return res.status(OK).json(jsonFail('invalid `start` parameter'));
  } else {
    start = parseInt(startParam, 10);
  }

  // Ditto limitParam, but default to 5
  let limit;
  if (limitParam === undefined) {
    limit = 5;
  } else if (typeof limitParam !== 'string' || !isNumber(limitParam)) {
    return res.status(OK).json(jsonFail('invalid `limit` parameter'));
  } else {
    limit = parseInt(limitParam, 10);
  }

  // Create links to the next and previous page of results, if they exist.
  let previousPageLink;
  // A previous page exists if we can go back `n = limit` posts, and still have `start >= 0`
  if (start - limit >= 0) {
    previousPageLink = `${req.hostname}/posts?start=${
      start - limit
    }&limit=${limit}`;
  }

  const postCount = await prisma.post.count();

  let nextPageLink;
  // A next page exists if there are more than `n = start + limit` posts in the database
  if (postCount > start + limit) {
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

  /*
  // Get the first newer post before this page.
  const nextNewPageIndex = start - 1 >= 0 ? start - 1 : undefined;
  const nextNewPage = await prisma.post.findFirst({
    orderBy: [{ created: 'desc' }],
    skip: nextNewPageIndex,
  });

  // Get the first older post after this page
  const previousOldPageIndex =
    start + limit + 1 < postCount ? start + limit + 1 : undefined;
  const previousOldPage = await prisma.post.findFirst({
    orderBy: [{ created: 'desc' }],
    skip: previousOldPageIndex,
  });

  // Wire up next and previous pages
  if (nextNewPage !== null) {
    posts[0].nextPostLink = postURL(nextNewPage, req.hostname);
  }
  */

  // Return page links if they exist, and a list of posts
  return res.status(OK).json(
    jsonSuccess({
      _links: {
        previous: previousPageLink,
        next: nextPageLink,
      },
      posts: posts,
    })
  );
};

export { getPostList };
