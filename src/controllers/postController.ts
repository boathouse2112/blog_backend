import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { jsonFail, jsonSuccess } from 'src/util/functions';
import { PostData } from 'src/util/types';

const prisma = new PrismaClient();
const { OK } = StatusCodes;

const getPostNeighbors = async (postId: number) => {
  const result: [{ id: number; previousid: number; nextid: number }] =
    await prisma.$queryRaw(Prisma.sql`
  WITH shifted AS (
    SELECT id, created,
      LAG(id,1) OVER (ORDER BY created DESC) AS previousid,
      LEAD(id,1) OVER (ORDER BY created DESC) AS nextid
    FROM "Post"
  )
  SELECT id, previousid, nextid 
  FROM shifted
  WHERE id = ${postId};
  `);
  console.log(result);
  const { previousid: previousId, nextid: nextId } = result[0];
  console.log('previous', previousId);

  const previousPost = previousId
    ? await prisma.post.findUnique({
        where: { id: previousId },
      })
    : undefined;
  console.log('previousPost', previousPost);
  const nextPost = nextId
    ? await prisma.post.findUnique({ where: { id: nextId } })
    : undefined;

  return {
    previousPost: previousPost ?? undefined,
    nextPost: nextPost ?? undefined,
  };
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

  // Add the post's neighbors, so there can be links to next and previous posts.
  const neighbors = await getPostNeighbors(post.id);
  console.log('neighbors: ', neighbors);
  const postWithNeighbors: PostData = { ...post, ...neighbors };

  res.status(OK).json(jsonSuccess(postWithNeighbors));
};

export { getPost };
