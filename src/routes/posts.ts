import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getPostList } from 'src/controllers/postsController';

// Constants
const router = Router();
const { CREATED, OK, NOT_FOUND } = StatusCodes;

/// Main page routes ///

/**
 * @param start First page to get, zero-indexed. Optional.
 * @param limit Number of pages to get. Optional.
 * @returns One of:
 * {
 *    status: "success"
 *    data:   {
 *      _links: {
 *        "previous"?: "<LINK>"
 *        "next"?: "<LINK>"
 *      }
 *      posts: [
 *        { <POST_CONTENT> }
 *      ]
 *    }
 * }
 *
 * Or:
 * {
 *    status: "fail"
 *    data: {
 *      posts: "No posts found starting at <START_PARAM>"
 *    }
 * }
 *
 * If the request found a real API endpoint, I'm keeping errors in the JSON,
 * instead of responding with a 404 or something.
 */
router.get('/', getPostList);
router.get('/page/:pageNumber', getPostList);

export default router;
