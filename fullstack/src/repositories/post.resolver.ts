import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection, LessThan } from "typeorm";
import { Post } from "../entities/Post";
import { Vote } from "../entities/Vote";
import { isAuth } from "../middleware/isAuth";
import { NOT_AUTHORIZED } from "../utils/constants";
import { Context } from "../utils/types/Context";
import { validatePost } from "../utils/validation/post.validate";
import { PostResponse } from "./responses/post.response";

@InputType()
export class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean; // to prevent user from requesting more data is none exists.
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.length >= 50 ? root.text.slice(0, 50) + "..." : root.text;
  }
  @FieldResolver(() => String)
  titleSnippet(@Root() root: Post) {
    return root.title.length >= 50
      ? root.title.slice(0, 50) + "..."
      : root.title;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: Context
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const morePostsExist = realLimit + 1; // to deal with pagination.
    // if we request limit + 1 and get that back, we know there's more items to be fetched in the future for the client.

    const { userId } = req.session;
    const getPosts = await Post.find({
      take: morePostsExist,
      where:
        cursor == null
          ? {}
          : {
              createdAt: LessThan(new Date(parseInt(cursor))),
            },
      order: { createdAt: "DESC" },
      relations: ["creator"],
    }).then(async (x) => {
      for (let i = 0; i < x.length; i++) {
        const vote = await Vote.findOne({ postId: x[i].id, userId });
        x[i].voteStatus = vote?.value || null;
      }
      return x;
    });

    return {
      posts: getPosts.slice(0, realLimit), //cutoff at requested-limit
      hasMore: getPosts.length === morePostsExist,
    };
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return await Post.findOne(id, { relations: ["creator"] });
  }

  @Mutation(() => PostResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: Context
  ): Promise<PostResponse | null> {
    const { userId } = req.session;
    const errors = validatePost(userId, input);
    if (errors) {
      return { errors };
    }

    const post = await Post.create({
      creatorId: req.session.userId,
      ...input,
    }).save();

    return { post };
  }

  @Mutation(() => PostResponse, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("input") input: PostInput,
    @Ctx() { req }: Context
  ): Promise<PostResponse | null> {
    const { userId } = req.session;
    const errors = validatePost(userId, input, await Post.findOne(id));

    if (errors) {
      return { errors };
    }

    const post = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ ...input })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: userId,
      })
      .returning("*")
      .execute()
      .then((response) => {
        return response.raw[0];
      });

    return { post };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: Context
  ): Promise<Boolean> {
    try {
      const post = await Post.findOne(id);
      if (!post) {
        return false;
      }

      const { userId } = req.session;
      if (post.creatorId != userId) {
        throw new Error(NOT_AUTHORIZED);
      }

      // await Vote.delete({ postId: id }); // using CASCADE instead.
      await Post.delete({ id, creatorId: userId });
      //only creator is able to delete their own posts.
      //@todo: add support for admin-roles.
    } catch (ex) {
      console.log("Error while deleting post", ex);
      return false;
    }
    return true;
  }
}
