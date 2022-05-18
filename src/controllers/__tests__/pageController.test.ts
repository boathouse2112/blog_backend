import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { getMonth, getPage, getYear } from '../pageController';

// Posts
const postOnDate = (year: number, month: number, day: number, slug: string) =>
  postAtHour(year, month, day, 0, slug);

const postAtHour = (
  year: number,
  month: number,
  day: number,
  hour: number,
  slug: string
) => ({
  id: Math.ceil(Math.random() * 1000), // Unique integer ID
  title: "These days, it's blue to be green.",
  slug,
  created: dayjs.utc({ year, month: month - 1, day, hour } as any).toDate(),
  body: `I know what you're thinking, but the science is in.
    These days, it's just plain blue to be green.`,
});

const END_OF_2021 = postOnDate(2021, 12, 31, 'end-of-2021');
const START_OF_2022 = postOnDate(2022, 1, 1, 'start-of-2022');
const END_OF_2022 = postOnDate(2022, 12, 31, 'end-of-2022');
const START_OF_2023 = postOnDate(2023, 1, 1, 'start-of-2023');

const JAN_1 = postOnDate(2000, 1, 1, 'jan-1');
const JAN_2 = postOnDate(2000, 1, 2, 'jan-2');
const JAN_3 = postOnDate(2000, 1, 3, 'jan-3');
const JAN_4 = postOnDate(2000, 1, 4, 'jan-4');
const JAN_5 = postOnDate(2000, 1, 5, 'jan-5');

const HOUR_1 = postAtHour(2000, 1, 1, 1, 'hour-1');
const HOUR_2 = postAtHour(2000, 1, 1, 2, 'hour-2');
const HOUR_3 = postAtHour(2000, 1, 1, 3, 'hour-3');
const HOUR_4 = postAtHour(2000, 1, 1, 4, 'hour-4');
const HOUR_5 = postAtHour(2000, 1, 1, 5, 'hour-5');
const HOUR_6 = postAtHour(2000, 1, 1, 6, 'hour-6');

// Initialize prisma client
const prisma = new PrismaClient();

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

describe('getPage', () => {
  beforeAll(async () => {
    await prisma.post.createMany({
      data: [
        START_OF_2022,
        END_OF_2022,
        START_OF_2023,
        END_OF_2021,
        JAN_1,
        JAN_2,
        JAN_3,
        JAN_4,
        JAN_5,
      ],
    });
  });

  afterAll(async () => {
    // Truncate the Post table
    await prisma.post.deleteMany({ where: {} });
  });

  test('gets a full page of posts', async () => {
    // arrange
    const req = {
      params: { page: '1' }, // Route params are always strings.
    } as any;
    const res = responseDouble();

    // act
    await getPage(req, res);

    // assert
    expect(res._json).toStrictEqual({
      status: 'success',
      data: {
        numberOfPages: 2,
        posts: [START_OF_2023, END_OF_2022, START_OF_2022, END_OF_2021, JAN_5],
      },
    });
  });

  test('gets a partial page of posts', async () => {
    // arrange
    const req = {
      params: { page: '2' }, // Route params are always strings.
    } as any;
    const res = responseDouble();

    // act
    await getPage(req, res);

    // assert
    expect(res._json).toStrictEqual({
      status: 'success',
      data: {
        numberOfPages: 2,
        posts: [JAN_4, JAN_3, JAN_2, JAN_1],
      },
    });
  });

  test('reports failure if given a page that is too high', async () => {
    // arrange
    const req = {
      params: { page: '3' }, // Route params are always strings.
    } as any;
    const res = responseDouble();

    // act
    await getPage(req, res);

    // assert
    expect(res._json.status).toBe('failure');
  });

  test('reports failure if given a non-numeric page', async () => {
    // arrange
    const req = {
      params: { page: 'not-a-number' }, // Route params are always strings.
    } as any;
    const res = responseDouble();

    // act
    await getPage(req, res);

    // assert
    expect(res._json.status).toBe('failure');
  });
});

describe('getYear', () => {
  beforeAll(async () => {
    await prisma.post.createMany({
      data: [START_OF_2022, END_OF_2022, START_OF_2023, END_OF_2021],
    });
  });

  afterAll(async () => {
    // Truncate the Post table
    await prisma.post.deleteMany({ where: {} });
  });

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

  test('reports failure if no posts exist in a given year', async () => {
    // arrange
    const req = {
      params: { year: '1998', page: '1' }, // Route params are always strings.
    } as any;
    const res = responseDouble();

    // act
    await getYear(req, res);

    // assert
    expect(res._json.status).toBe('failure');
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

describe('getMonth', () => {
  beforeAll(async () => {
    await prisma.post.createMany({
      data: [HOUR_1, HOUR_2, HOUR_3, HOUR_4, HOUR_5, HOUR_6],
    });
  });

  afterAll(async () => {
    await prisma.post.deleteMany({ where: {} });
  });

  test('gets a page of results when the month matches.', async () => {
    // arrange
    const req = {
      params: { year: '2000', month: '1', page: '1' }, // Route params are always strings.
    } as any;
    const res = responseDouble();

    // act
    await getMonth(req, res);

    // assert
    expect(res._json).toStrictEqual({
      status: 'success',
      data: {
        numberOfPages: 2,
        posts: [HOUR_6, HOUR_5, HOUR_4, HOUR_3, HOUR_2],
      },
    });
  });
});
