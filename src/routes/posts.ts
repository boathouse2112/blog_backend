import { Router } from 'express';

// Constants
const router = Router();

/// Main page routes ///

/**
 * /page/:pageNumber
 * @param pageNumber
 * @returns One of:
 * {
 *    status: "success"
 *    data:   {
 *      _links: {
 *        "previousPage"?: <API_PATH>
 *        "nextPage"?: "<API_PATH>"
 *      }
 *      posts: [
 *        {
 *          <POST_CONTENT>,
 *          authorName,
 *          authorLink,          // Relative to hostname
 *          previousPostLink?,
 *          nextPostLink?,
 *        }
 *      ]
 *    }
 * }
 *
 * Or:
 * {
 *    status: "fail"
 *    data: "No posts found on page <PAGE_NUMBER>"
 * }
 *
 * If the request found a real API endpoint, I'm keeping errors in the JSON,
 * instead of responding with a 404 or something.
 */
// router.get('/page/:pageNumber', getPostList);
// router.get('/:slug', getPost);

export default router;
