import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { getYear } from '../pageController';

// Post constants
const postOnDate = (year: number, month: number, day: number, slug: string) => {
  return {
    id: Math.ceil(Math.random() * 1000), // Unique integer ID
    title: "These days, it's blue to be green.",
    slug,
    created: dayjs([year, month, day]).toDate(),
    body: `I know what you're thinking, but the science is in.
    These days, it's just plain blue to be green.`,
  };
};

const START_OF_2022 = postOnDate(2022, 1, 1, 'start-of-2022');
const END_OF_2022 = postOnDate(2022, 12, 31, 'end-of-2022');
const START_OF_2023 = postOnDate(2023, 1, 1, 'start-of-2023');

// Initialize prisma client
const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.post.createMany({
    data: [START_OF_2022, END_OF_2022, START_OF_2023],
  });
});

afterAll(async () => {
  // Truncate the Post table
  await prisma.post.deleteMany({ where: {} });
});

// Response test double
// Sent JSON can be read from _json property
const responseDouble = () =>
  ({
    _json: undefined,
    status: function (..._: any[]) {
      return this;
    },
    json: function (data: any) {
      console.log('data ', data);
      this._json = data;
    },
  } as any);

describe('getYear', () => {
  test('gets posts that exist in a given year', async () => {
    // arrange
    const req = {
      params: { year: '2022', page: '1' }, // Route params are always strings.
    } as any;
    const res = responseDouble();

    // act
    await getYear(req, res);

    // assert
    expect(res._json).toStrictEqual({
      status: 'success',
      data: {
        numberOfPages: 1,
        posts: [END_OF_2022, START_OF_2022],
      },
    });
  });

  test('returns [] if no posts exist in a given year', async () => {
    // arrange
    const req = {
      params: { year: '1998', page: '1' }, // Route params are always strings.
    } as any;
    const res = responseDouble();

    // act
    await getYear(req, res);

    // assert
    expect(res._json).toStrictEqual({
      status: 'success',
      data: {
        numberOfPages: 1,
        posts: [],
      },
    });
  });

  test('reports failure if given a non-numeric year parameter', async () => {
    // arrange
    const req = {
      params: { year: 'not-a-number', page: '1' }, // Route params are always strings.
    } as any;
    const res = responseDouble();

    // act
    await getYear(req, res);

    // assert
    expect(res._json.status).toBe('failure');
  });
});
