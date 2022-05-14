import { Post } from '@prisma/client';
import dayjs from 'dayjs';
import logger from 'jet-logger';

/**
 * Print an error object if it's truthy. Useful for testing.
 *
 * @param err
 */
function pErr(err?: Error): void {
  if (!!err) {
    logger.err(err);
  }
}

/**
 * Get a random number between 1 and 1,000,000,000,000
 *
 * @returns
 */
function getRandomInt(): number {
  return Math.floor(Math.random() * 1_000_000_000_000);
}

// TODO: The URLs are specific to our front-end. It's a bad idea to calculate it on the back-end.
/**
 * Get the relative URL of the given post.
 * @param post
 */
const postURL = (post: Post): string => {
  const dateString = dayjs(post.created).format('YYYY/MM/DD');
  const slug = post.slug;
  return `${dateString}/${slug}`;
};

/**
 * Determine whether the given string is a number.
 *
 * @param value
 * @returns
 */
const isNumber = (value: string) => /^-?\d+$/.test(value);

export { pErr, getRandomInt, postURL, isNumber };
