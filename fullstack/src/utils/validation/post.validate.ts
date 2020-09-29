import { NOT_AUTHORIZED } from "../../constants";
import { Post } from "../../entities/Post";

export const validatePost = (
  userId: number,
  title: string,
  text: string,
  post?: Post
) => {
  if (!post) {
    return null;
  }

  if (title.length <= 5) {
    return [
      {
        field: "title",
        message: "Post title must be at least 5 characters.",
      },
    ];
  }
  if (text.length <= 5) {
    return [
      {
        field: "text",
        message: "Post title must be at least 5 characters.",
      },
    ];
  }
  if (post.creatorId !== userId) {
    throw new Error(NOT_AUTHORIZED);
  }

  return post;
};
