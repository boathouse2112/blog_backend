import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// Populate the database with some test posts.

const prisma = new PrismaClient();

const posts = new Array<Prisma.PostCreateInput>(20).fill(
  {
    slug: 'i-dont-think-so' + randomUUID().toString(),
    title: "I don't think so.",
    body:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor ' +
      'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ' +
      'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' +
      'Duis aute irure dolor in reprehenderit in voluptate ' +
      'velit esse cillum dolore eu fugiat nulla pariatur. ' +
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa ' +
      'qui officia deserunt mollit anim id est laborum.',
    author: {
      connectOrCreate: {
        create: { email: 'boathouse2112@gmail.com', name: 'Mark Murphy' },
        where: { email: 'boathouse2112@gmail.com' },
      },
    },
  },
  0,
  20
);

const main = async () => {
  await prisma.$connect();

  // Create posts
  posts.forEach(async (post) => {
    await prisma.post.create({ data: post });
  });

  console.log(await prisma.post.findMany());
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
