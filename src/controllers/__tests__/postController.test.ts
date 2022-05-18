import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { getPost } from '../postController';

dayjs.extend(utc);

const postOnDate = (
  year: number,
  month: number,
  day: number,
  slug: string
) => ({
  id: Math.ceil(Math.random() * 1000), // Unique integer ID
  title: "These days, it's blue to be green.",
  slug,
  created: dayjs.utc([year, month, day]).toDate(),
  body: `I know what you're thinking, but the science is in.
    These days, it's just plain blue to be green.`,
});

const JAN_1 = postOnDate(2000, 1, 1, 'jan-1');
const JUNE_15 = postOnDate(2000, 6, 1, 'june-15');
const DEC_31_NEXT_YEAR = postOnDate(2001, 12, 31, 'dec-31-next-year');

// Response test double
// Sent JSON can be read from _json property
const responseDouble = () =>
  ({
    _json: undefined,
    status: function (..._: any[]) {
      return this;
    },
    json: function (data: any) {
      this._json = data;
    },
  } as any);

// Initialize prisma client
const prisma = new PrismaClient();

describe('getPost', () => {
  afterEach(async () => {
    // Truncate Post table
    await prisma.post.deleteMany({ where: {} });
  });

  test('gives the requested post - with nextPost and previousPost undefined - if there are  no neighbors', async () => {
    // arrange
    await prisma.post.create({ data: JAN_1 });
    const req = {
      params: { slug: 'jan-1' },
    } as any;
    const res = responseDouble();

    // act
    await getPost(req, res);

    // assert
    expect(res._json).toStrictEqual({
      status: 'success',
      data: {
        ...JAN_1,
        previousPost: undefined,
        nextPost: undefined,
      },
    });
  });

  test('gives a nextPost if one exists', async () => {
    // arrange
    await prisma.post.createMany({ data: [JAN_1, JUNE_15, DEC_31_NEXT_YEAR] });
    const req = {
      params: { slug: 'dec-31-next-year' },
    } as any;
    const res = responseDouble();

    // act
    await getPost(req, res);

    // assert
    expect(res._json).toStrictEqual({
      status: 'success',
      data: {
        ...DEC_31_NEXT_YEAR,
        previousPost: undefined,
        nextPost: JUNE_15,
      },
    });
  });

  test('gives a previousPost if one exists', async () => {
    // arrange
    await prisma.post.createMany({ data: [JAN_1, JUNE_15, DEC_31_NEXT_YEAR] });
    const req = {
      params: { slug: 'jan-1' },
    } as any;
    const res = responseDouble();

    // act
    await getPost(req, res);

    // assert
    expect(res._json).toStrictEqual({
      status: 'success',
      data: {
        ...JAN_1,
        previousPost: JUNE_15,
        nextPost: undefined,
      },
    });
  });

  test('gives a previousPost and a nextPost if both exists', async () => {
    // arrange
    await prisma.post.createMany({ data: [JAN_1, JUNE_15, DEC_31_NEXT_YEAR] });
    const req = {
      params: { slug: 'june-15' },
    } as any;
    const res = responseDouble();

    // act
    await getPost(req, res);

    // assert
    expect(res._json).toStrictEqual({
      status: 'success',
      data: {
        ...JUNE_15,
        previousPost: DEC_31_NEXT_YEAR,
        nextPost: JAN_1,
      },
    });
  });
});
