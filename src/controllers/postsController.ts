import { Post, PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();
const { OK } = StatusCodes;

type PostResponse = {
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

// TODO: The URLs are specific to our front-end. It's a bad idea to calculate it on the back-end.
/**
 * Get the relative URL of the given post.
 * @param post
 */
const postURL = (post: Post): string => {
  const dateString = dayjs(post.created).format('YYYY/MM/DD');
  const slug = post.slug;
  return `${dateString}/${slug}`;
};

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
  const responsePosts: PostResponse[] = postsWithLinks;

  // Return page links if they exist, and a list of posts
  return res.status(OK).json(
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
