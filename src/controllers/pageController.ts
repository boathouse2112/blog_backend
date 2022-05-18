import { Prisma, PrismaClient } from '@prisma/client';
import dayjs, { ConfigType } from 'dayjs';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { isNumber, jsonFail, jsonSuccess } from 'src/util/functions';

const POSTS_PER_PAGE = 5;

const prisma = new PrismaClient();
const { OK } = StatusCodes;

const getPageWhere =
  (where?: Prisma.PostWhereInput) => async (req: Request, res: Response) => {
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
      where: where,
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

/**
 * Gets a single page of posts.
 * Returns `n = POSTS_PER_PAGE` posts.
 *
 * @param page The page of posts to get. Starts at page 1.
 * @returns
 */
const getPage = getPageWhere();

/**
 * Get the start of the given date.
 */
const startOf = (year: number, month?: number, day?: number) => {
  const dateArr = [year];
  if (month) dateArr.push(month);
  if (day) dateArr.push(day);

  return dayjs(dateArr as ConfigType)
    .startOf('year')
    .toDate();
};

/**
 * Get the end of the given date.
 */
const endOf = (year: number, month?: number, day?: number) => {
  const dateArr = [year];
  if (month) dateArr.push(month);
  if (day) dateArr.push(day);

  return dayjs(dateArr as ConfigType)
    .endOf('year')
    .toDate();
};

const getYear = (req: Request, res: Response) => {
  const { year: yearParam } = req.params;

  if (typeof yearParam !== 'string' || !isNumber(yearParam)) {
    res.status(OK).json(jsonFail('invalid `year` parameter'));
    return;
  }

  const year = parseInt(yearParam, 10);

  const getPage = getPageWhere({
    created: { gte: startOf(year), lte: endOf(year) },
  });

  getPage(req, res);
};

export { getPage, getYear };
