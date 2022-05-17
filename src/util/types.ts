import { Post } from '@prisma/client';

type PostData = Post & {
  previousPost?: Post;
  nextPost?: Post;
};

type PostListResponse = {
  numberOfPages: number;
  posts: PostData[];
};

type JSONSuccessData = PostListResponse | PostData;

type JSONSuccess = {
  status: 'success';
  data: JSONSuccessData;
};

type JSONFailure = {
  status: 'failure' | 'error';
  data: string;
};

type JSONResponse = JSONSuccess | JSONFailure;

export type {
  PostData,
  PostListResponse,
  JSONSuccessData,
  JSONSuccess,
  JSONFailure,
  JSONResponse,
};
