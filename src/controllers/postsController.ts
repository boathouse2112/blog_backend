import { Post, Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { isNumber, postURL } from 'src/util/functions';

const prisma = new PrismaClient();
const { OK } = StatusCodes;

const POSTS_PER_PAGE = 5;

type PostData = Post & {
  previousPost?: Post;
  nextPost?: Post;
};

type PostListResponse = {
  numberOfPages: number;
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

const getPostNeighbors = async (postId: number) => {
  const result: [{ id: number; previousId: number; nextId: number }] =
    await prisma.$queryRaw(Prisma.sql`
  WITH shifted AS (
    SELECT id, created,
      LAG(id,1) OVER (ORDER BY created DESC) AS previousId,
      LEAD(id,1) OVER (ORDER BY created DESC) AS nextId
    FROM "Post"
  )
  SELECT id, previousId, nextId 
  FROM shifted
  WHERE id = ${postId};
  `);
  const { previousId, nextId } = result[0];

  const previousPost = prisma.post.findFirst({ where: { id: previousId } });
  const nextPost = prisma.post.findFirst({ where: { id: nextId } });

  return {
    previousPost: (await previousPost) ?? undefined,
    nextPost: (await nextPost) ?? undefined,
  };
};

/**
 * Gets a single page of posts.
 * Returns `n = POSTS_PER_PAGE` posts.
 *
 * @param page The page of posts to get.
 * @returns
 */
const getPostList = async (req: Request, res: Response): Promise<void> => {
  const { pageNumber: pageParam } = req.params;

  // If startParam is undefined, set to 0. If it can't be parsed to a number, return "fail"
  let page;
  if (pageParam === undefined) {
    page = 0;
  } else if (typeof pageParam !== 'string' || !isNumber(pageParam)) {
    res.status(OK).json(jsonFail('invalid `page` parameter'));
    return;
  } else {
    page = parseInt(pageParam, 10);
  }

  const start = page * POSTS_PER_PAGE; // Post to start db query at

  const postCount = await prisma.post.count();
  const numberOfPages = Math.ceil(postCount / POSTS_PER_PAGE);

  // Update start and limit to get one extra post on each end, if they exist.
  // This lets us add links to previous and next post.
  const newerPostExists = page > 0;
  const olderPostExists = page + POSTS_PER_PAGE + 1 < postCount;

  /*
  let skip, dbLimit;
  if (newerPostExists && olderPostExists) {
    skip = start - 1;
    dbLimit = POSTS_PER_PAGE + 2; // +1 for each additional post
  } else if (newerPostExists && !olderPostExists) {
    skip = start - 1;
    dbLimit = POSTS_PER_PAGE + 1;
  } else if (!newerPostExists && olderPostExists) {
    skip = start;
    dbLimit = POSTS_PER_PAGE + 1;
  } else {
    skip = start;
    dbLimit = POSTS_PER_PAGE;
  }
  */
  //console.log(`Skip: ${skip}, dbLimit: ${dbLimit}`);
  const posts = await prisma.post.findMany({
    orderBy: [{ created: 'desc' }],
    skip: start,
    take: POSTS_PER_PAGE,
  });
  console.log(posts.length);

  // Wire up nextPost links.
  const postsWithNextLinks = posts.map((post, idx) => {
    // The earlier a post is in Post[], the newer it is
    const nextPost = posts[idx - 1];
    return nextPost === undefined ? post : { ...post, nextPost };
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
  const responsePosts: Post[] = postsWithLinks;

  // Return page links if they exist, and a list of posts
  res.status(OK).json(
    jsonSuccess({
      numberOfPages,
      posts: responsePosts,
    })
  );
};

const getPost = async (req: Request, res: Response) => {
  const { slug } = req.params;

  // If slug is undefined, return "fail"
  if (slug === undefined) {
    res.status(OK).json(jsonFail('Panic: no :slug param'));
    return;
  }

  // Query the database for the requested post
  const post = await prisma.post.findFirst({ where: { slug: slug } });

  if (post === null) {
    res.status(OK).json(jsonFail(`Post with slug ${slug} not found.`));
    return;
  }
};

export { getPostList, getPostNeighbors };
