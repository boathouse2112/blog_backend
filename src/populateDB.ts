import { Prisma, PrismaClient } from '@prisma/client';

// Populate the database with some test posts.

const prisma = new PrismaClient();

const titles = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'this last post title is quite long. Quite a slog. Veryyyyy lengthy.',
];

const createPost: (title: string) => Prisma.PostCreateManyInput = (
  title: string
) => ({
  slug: title,
  title: title,
  body:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor ' +
    'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ' +
    'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' +
    'Duis aute irure dolor in reprehenderit in voluptate ' +
    'velit esse cillum dolore eu fugiat nulla pariatur. ' +
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa ' +
    'qui officia deserunt mollit anim id est laborum.',
});

const posts = titles.map(createPost).reverse();

const main = async () => {
  await prisma.$connect();

  // Create posts
  for (const post of posts) {
    await prisma.post.create({ data: post });
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
