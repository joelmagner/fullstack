import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
import { Vote } from "../entities/Vote";
import { isAuth } from "../middleware/isAuth";
import { Context } from "../types";

enum VoteAction {
  Up = 1,
  Down = -1,
}

@Resolver()
export class VoteResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: Context
  ) {
    const { userId } = req.session;
    const isUpvote = value !== VoteAction.Down;
    const vote = isUpvote ? VoteAction.Up : VoteAction.Down;
    const userAlreadyVoted = await Vote.findOne({ where: { postId, userId } });

    const currentPostVotes: number | undefined = await Post.findOne({
      where: { id: postId },
    }).then((x) => x?.votes);

    if (!userAlreadyVoted) {
      // has not voted, insert vote
      await Vote.insert({ userId, postId, value: vote });

      if (currentPostVotes !== undefined) {
        await Post.update(postId, { votes: currentPostVotes + vote });
        return true;
      }
      return false;
    }

    if (
      userAlreadyVoted &&
      vote === VoteAction.Up &&
      userAlreadyVoted.value == value &&
      currentPostVotes !== undefined
    ) {
      //the user has already upvoted, remove it.
      await Post.update(postId, { votes: currentPostVotes + VoteAction.Down }); //negate overall votes
      await Vote.delete({ userId, postId, value }); // reset vote-table
      return false;
    } else if (
      userAlreadyVoted &&
      userAlreadyVoted.value === VoteAction.Down &&
      userAlreadyVoted.value == value &&
      currentPostVotes !== undefined
    ) {
      //the user has already downvoted, remove it.
      await Post.update(postId, { votes: currentPostVotes + VoteAction.Up });
      await Vote.delete({ userId, postId, value });
      return false;
    } else if (
      userAlreadyVoted &&
      userAlreadyVoted.value !== value &&
      currentPostVotes !== undefined
    ) {
      //user changed from up to downvote or vise versa
      await Post.update(postId, { votes: currentPostVotes + 2 * vote });
      await Vote.update({ userId, postId }, { value: vote });
    }
    // console.log(
    //   "\nuservote: ",
    //   userAlreadyVoted,
    //   "\nupvote?: ",
    //   userAlreadyVoted?.value === VoteAction.Up,
    //   "\ndownvote?: ",
    //   userAlreadyVoted?.value === VoteAction.Down,
    //   "\ncurrent value matches prev vote: ",
    //   userAlreadyVoted?.value == value,
    //   "\ncurrentPostVotes",
    //   currentPostVotes,
    //   "overall expression upvote",
    //   userAlreadyVoted &&
    //     userAlreadyVoted.value === VoteAction.Up &&
    //     userAlreadyVoted.value == value,
    //   "overall expression downvote",
    //   userAlreadyVoted &&
    //     userAlreadyVoted.value === VoteAction.Down &&
    //     userAlreadyVoted.value == value
    // );
    return true;
  }

  @Query(() => Vote, { nullable: true })
  @UseMiddleware(isAuth)
  async getPostVotes(
    @Arg("postId", () => Int) postId: number,
    @Ctx() { req }: Context
  ): Promise<Vote | null> {
    const { userId } = req.session;
    const response = await Vote.findOne({ where: { postId, userId } });
    return response || null;
  }
}
