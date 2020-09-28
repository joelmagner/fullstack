import { CircularProgress, Flex, Icon, Text } from "@chakra-ui/core";
import React, { useState } from "react";
import { PostFragmentFragment, useVoteMutation } from "../generated/graphql";

interface VoteSectionProps {
  post: PostFragmentFragment;
}

enum VoteAction {
  Up = 1,
  Down = -1,
}

export const VoteSection: React.FC<VoteSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "upvote-loading" | "downvote-loading" | "not-loading"
  >("not-loading");
  const [{ data }, vote] = useVoteMutation();

  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      {loadingState === "upvote-loading" ? (
        <CircularProgress
          mt={1}
          size="12px"
          isIndeterminate
          color="green"
        ></CircularProgress>
      ) : (
        <Icon
          name={"chevron-up"}
          size="24px"
          cursor="pointer"
          color={
            post.voteStatus === VoteAction.Up && data?.vote != false
              ? "green.500"
              : undefined
          }
          onClick={async () => {
            setLoadingState("upvote-loading");
            await vote({
              postId: post.id,
              value: VoteAction.Up,
            });
            setLoadingState("not-loading");
          }}
        />
      )}

      <Text textAlign="center" fontWeight="bold">
        {post.votes}
      </Text>
      {loadingState === "downvote-loading" ? (
        <CircularProgress
          mt={1}
          size="12px"
          isIndeterminate
          color="green"
        ></CircularProgress>
      ) : (
        <Icon
          name={"chevron-down"}
          size="24px"
          cursor="pointer"
          color={
            post.voteStatus === VoteAction.Down && data?.vote != false
              ? "red.500"
              : undefined
          }
          onClick={async () => {
            setLoadingState("downvote-loading");
            await vote({
              postId: post.id,
              value: VoteAction.Down,
            });

            setLoadingState("not-loading");
          }}
        />
      )}
    </Flex>
  );
};
