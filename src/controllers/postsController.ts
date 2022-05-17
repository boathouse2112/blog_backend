import { Post, Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { isNumber } from 'src/util/functions';

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
 * @param page The page of posts to get. Starts at page 1.
 * @returns
 */
const getPostList = async (req: Request, res: Response): Promise<void> => {
  const { page: pageParam } = req.params;

  console.log(req.params);
  console.log('pageParam: ', pageParam);
  console.log(typeof pageParam);

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

  console.log(`skip: ${start}, take: ${POSTS_PER_PAGE}`);
  const posts = await prisma.post.findMany({
    orderBy: [{ created: 'desc' }],
    skip: start,
    take: POSTS_PER_PAGE,
  });
  console.log(posts);
  /*

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
  */

  // Return page links if they exist, and a list of posts
  res.status(OK).json(
    jsonSuccess({
      numberOfPages,
      posts: posts,
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
