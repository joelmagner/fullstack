import { Post } from "../../entities/Post";
import { PostInput } from "../../repositories/post.resolver";
import { NOT_AUTHORIZED } from "../constants";

export const validatePost = (userId: number, input: PostInput, post?: Post) => {
  if (input.title.length <= 5) {
    return [
      {
        field: "title",
        message: "Post title must be at least 5 characters.",
      },
    ];
  }
  if (input.text.length <= 5) {
    return [
      {
        field: "text",
        message: "Post text must have at least 5 characters.",
      },
    ];
  }
  if (post && post.creatorId !== userId) {
    throw new Error(NOT_AUTHORIZED);
  }

  return null;
};
