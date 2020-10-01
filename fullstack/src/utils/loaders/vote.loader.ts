import DataLoader from "dataloader";
import { Vote } from "../../entities/Vote";

// [{postId: 2, userId: 4}] => vote == 1 | -1 | null

export const voteLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Vote | null>(
    async (keys) => {
      const Votes = await Vote.findByIds(keys as any);
      const VoteIdsToVote: Record<string, Vote> = {};
      Votes.forEach((Vote) => {
        VoteIdsToVote[`${Vote.userId}|${Vote.postId}`] = Vote;
      });

      const response = keys.map(
        (key) => VoteIdsToVote[`${key.userId}|${key.postId}`]
      );
      return response;
    }
  );
