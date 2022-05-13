import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { isNumber, postURL } from 'src/util/functions';

const prisma = new PrismaClient();
const { OK } = StatusCodes;

const POSTS_PER_PAGE = 5;

type PostData = {
  id: string;
  slug: string;
  title: string;
  body: string;
  created: Date;
  nextPost?: {
    title: string;
    URL: string;
  };
  previousPost?: {
    title: string;
    URL: string;
  };
};

type PostListResponse = {
  _links: {
    previous?: string;
    next?: string;
  };
  posts: PostData[];
};

type JSONSuccess = {
  status: 'success';
  data: PostListResponse;
};

type JSONFailure = {
  status: 'failure' | 'error';
  data: string;
};

type JSONResponse = JSONSuccess | JSONFailure;

const jsonSuccess = (data: PostListResponse): JSONResponse => ({
  status: 'success',
  data,
});

const jsonFail = (failMessage: string): JSONResponse => ({
  status: 'failure',
  data: failMessage,
});

/**
 * Gets a single page of posts.
 * Returns `n = POSTS_PER_PAGE` posts.
 *
 * @param page The page of posts to get.
 * @returns
 */
const getPostList = async (req: Request, res: Response): Promise<void> => {
  const startParam = req.query.start; // Post to start at, zero-indexed
  const limitParam = req.query.limit; // Number of pages to return

  // If startParam is undefined, set to 0. If it can't be parsed to a number, return "fail"
  let start;
  if (startParam === undefined) {
    start = 0;
  } else if (typeof startParam !== 'string' || !isNumber(startParam)) {
    res.status(OK).json(jsonFail('invalid `start` parameter'));
    return;
  } else {
    start = parseInt(startParam, 10);
  }

  // Ditto limitParam, but default to 5
  let limit;
  if (limitParam === undefined) {
    limit = 5;
  } else if (typeof limitParam !== 'string' || !isNumber(limitParam)) {
    res.status(OK).json(jsonFail('invalid `limit` parameter'));
    return;
  } else {
    limit = parseInt(limitParam, 10);
  }

  const postCount = await prisma.post.count();

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
  if (postCount > start + limit) {
    nextPageLink = `${req.hostname}/posts?start=${
      start + limit
    }&limit=${limit}`;
  }

  // Update start and limit to get one extra post on each end, if they exist.
  // This lets us add links to previous and next post.
  const newerPostExists = start > 0;
  const olderPostExists = start + limit + 1 < postCount;

  let dbStart, dbLimit;
  if (newerPostExists && olderPostExists) {
    dbStart = start - 1;
    dbLimit = limit + 2; // +1 for each additional post
  } else if (newerPostExists && !olderPostExists) {
    dbStart = start - 1;
    dbLimit = limit + 1;
  } else if (!newerPostExists && olderPostExists) {
    dbStart = start;
    dbLimit = limit + 1;
  } else {
    dbStart = start;
    dbLimit = limit;
  }
  const posts = await prisma.post.findMany({
    orderBy: [{ created: 'desc' }],
    skip: dbStart,
    take: dbLimit,
  });
  console.log(posts.length);

  // Wire up nextPost links.
  const postsWithNextLinks = posts.map((post, idx) => {
    // The earlier a post is in Post[], the newer it is
    const nextPost = posts[idx - 1];
    const nextPostValues =
      nextPost === undefined
        ? undefined
        : {
            title: nextPost.title,
            URL: postURL(nextPost),
          };
    return nextPost === undefined ? post : { ...post, nextPostValues };
  });
  console.log(posts.length);

  const postsWithLinks = postsWithNextLinks.map((post, idx) => {
    const previousPost = posts[idx + 1];
    const previousPostValues =
      previousPost === undefined
        ? undefined
        : {
            title: previousPost.title,
            URL: postURL(previousPost),
          };
    return previousPost === undefined ? post : { ...post, previousPostValues };
  });

  // Now that we've added our links, remove any extra posts we queried.
  if (newerPostExists) {
    // Remove the first post
    postsWithLinks.shift();
  }
  if (olderPostExists) {
    // Remove the last post
    postsWithLinks.pop();
  }
  console.assert(postsWithLinks.length > 0);

  // Ensure that we have the right response type
  const responsePosts: PostData[] = postsWithLinks;

  // Return page links if they exist, and a list of posts
  res.status(OK).json(
    jsonSuccess({
      _links: {
        previous: previousPageLink,
        next: nextPageLink,
      },
      posts: responsePosts,
    })
  );
};

export { getPostList };
