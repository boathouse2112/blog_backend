import { Post } from '@prisma/client';
import dayjs from 'dayjs';
import { JSONResponse, JSONSuccessData } from './types';

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

/**
 * Create a successful JSON response
 * @param data
 * @returns
 */
const jsonSuccess = (data: JSONSuccessData): JSONResponse => ({
  status: 'success',
  data,
});

/**
 * Create a failing JSON response
 * @param failMessage
 * @returns
 */
const jsonFail = (failMessage: string): JSONResponse => ({
  status: 'failure',
  data: failMessage,
});

export { postURL, isNumber, jsonSuccess, jsonFail };
