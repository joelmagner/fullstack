import { Divider, Flex, Box, IconButton, Link } from "@chakra-ui/core";
import React from "react";
import NextLink from "next/link";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";
interface PostActionProps {
  id: number;
  creatorId: number;
  divider?: boolean;
}

export const PostActions: React.FC<PostActionProps> = ({
  id,
  creatorId,
  divider = true,
}) => {
  const [, deletePost] = useDeletePostMutation();

  const [{ data: meQuery }] = useMeQuery();
  if (meQuery?.me?.id !== creatorId) {
    return null;
  }

  return (
    <>
      {divider ? <Divider /> : null}
      <Flex>
        <Box ml="auto">
          <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
            <IconButton
              as={Link}
              mr={4}
              icon="edit"
              aria-label="Edit post"
            ></IconButton>
          </NextLink>

          <IconButton
            icon="delete"
            aria-label="Delete post"
            onClick={async () => await deletePost({ id })}
          ></IconButton>
        </Box>
      </Flex>
    </>
  );
};
