import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// Populate the database with some test posts.

const prisma = new PrismaClient();

/*
const authorID = 'author-' + randomUUID().toString();
const author: Prisma.UserCreateInput = {
  id: authorID,
  email: 'boathouse2112@gmail.com',
  name: 'Mark Murphy',
};
*/

const createPost: () => Prisma.PostCreateManyInput = () => ({
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
  authorID: '627a794e44083b287816dd08',
});

const posts = Array.from({ length: 20 }, () => createPost());

/*
// Wire up next posts
posts.forEach((post, idx) => {
  const nextPost = posts[idx + 1];
  if (nextPost !== undefined) {
    post.nextPost = { connect: { slug: nextPost.slug } };
  }
});

// And previous posts
posts.forEach((post, idx) => {
  const previousPost = posts[idx - 1];
  if (previousPost !== undefined) {
    post.previousPost = { connect: { slug: previousPost.slug } };
  }
});
*/

const main = async () => {
  await prisma.$connect();

  // Create author
  // await prisma.user.create({ data: author });

  // Create posts
  await prisma.post.createMany({ data: posts });

  // Wire up next posts
  await Promise.all(
    posts.map(async (post, idx) => {
      const nextPost = posts[idx + 1];
      if (nextPost !== undefined) {
        await prisma.post.update({
          where: { id: post.id, slug: post.slug }, // Why does this require both fields?
          data: { nextPost: { connect: { slug: nextPost.slug } } },
        });
      }
    })
  );
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
