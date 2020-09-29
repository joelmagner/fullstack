import {
  Box,
  CircularProgress,
  Flex,
  Heading,
  Text,
  Stack,
  Divider,
  IconButton,
} from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { Layout } from "../../components/Layout";
import { useDeletePostMutation, usePostQuery } from "../../generated/graphql";
import { urqlClient } from "../../utils/urqlClient";

interface PostPageProps {}

const Post: React.FC<PostPageProps> = ({}) => {
  const router = useRouter();

  const postId =
    typeof router.query?.id === "string" ? parseInt(router.query?.id) : -1;

  const [{ data, error, fetching }] = usePostQuery({
    pause: postId === -1, // bad URL-param. Don't even bother sending request to server.
    variables: {
      id: postId,
    },
  });

  const [{ fetching: deleteProgress }, deletePost] = useDeletePostMutation();

  const postDate = new Date(
    parseInt(data?.post?.createdAt || "")
  ).toLocaleTimeString("en-US");

  if (fetching) {
    return (
      <Layout>
        <CircularProgress
          mt={1}
          size="64px"
          isIndeterminate
          color="green"
        ></CircularProgress>
        {"loading..."}
      </Layout>
    );
  }

  if (error) {
    return <Layout>{error}</Layout>;
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>Post could not be found...</Box>
      </Layout>
    );
  }

  if (data.post) {
    return (
      <Layout>
        <Stack spacing={8}>
          <Flex key={data.post.id} p={5} shadow="md" borderWidth="1px">
            {/* <VoteSection post={} /> */}
            <Box flex={1}>
              <Heading>{data.post.title}</Heading>
              <Flex>
                <Text mr={1}>Posted by</Text>
                <Text
                  style={{ textTransform: "capitalize", fontWeight: "bold" }}
                >
                  {data.post.creator.username}
                </Text>
                <Divider orientation="vertical" />
                <Text> {postDate} </Text>
              </Flex>

              <Flex align="center">
                <Text flex={1} mt={4}>
                  {data.post.text}
                </Text>
                <Box ml="auto"></Box>
              </Flex>
              {/* @todo: hide button if it's not your post. */}
              <Divider />
              <Flex>
                <IconButton
                  ml="auto"
                  icon="delete"
                  aria-label="Delete post"
                  isLoading={deleteProgress}
                  onClick={async () => await deletePost({ id: data!.post!.id })}
                ></IconButton>
              </Flex>
            </Box>
          </Flex>
        </Stack>
      </Layout>
    );
  }
};

export default withUrqlClient(urqlClient, { ssr: true })(Post);
