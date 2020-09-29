import {
  Box,
  CircularProgress,
  Divider,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
} from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React from "react";
import { Layout } from "../../components/Layout";
import { useDeletePostMutation, useMeQuery } from "../../generated/graphql";
import { getPostFromUrl } from "../../utils/getPostFromUrl";
import { urqlClient } from "../../utils/urqlClient";

interface PostPageProps {}

const Post: React.FC<PostPageProps> = ({}) => {
  const [{ data: meQuery }] = useMeQuery();
  const [{ data, error, fetching }] = getPostFromUrl();

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
  } else {
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
              {meQuery?.me?.id === data.post.creator.id ? (
                <>
                  <Divider />
                  <Flex>
                    <Box ml="auto">
                      <NextLink
                        href="/post/edit/[id]"
                        as={`/post/edit/${data.post.id}`}
                      >
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
                        isLoading={deleteProgress}
                        onClick={async () =>
                          await deletePost({ id: data!.post!.id })
                        }
                      ></IconButton>
                    </Box>
                  </Flex>
                </>
              ) : null}
            </Box>
          </Flex>
        </Stack>
      </Layout>
    );
  }
};

export default withUrqlClient(urqlClient, { ssr: true })(Post);
