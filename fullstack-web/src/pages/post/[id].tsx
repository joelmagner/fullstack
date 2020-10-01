import {
  Box,
  CircularProgress,
  Divider,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import React from "react";
import { Layout } from "../../components/Layout";
import { PostActions } from "../../components/PostActions";
import { getPostFromUrl } from "../../utils/getPostFromUrl";
import { urqlClient } from "../../utils/urqlClient";

interface PostPageProps {}

const Post: React.FC<PostPageProps> = ({}) => {
  const [{ data, error, fetching }] = getPostFromUrl();

  const postDate = new Date(
    parseInt(data?.post?.createdAt || "")
  ).toUTCString();

  // .toDateString("yyyy/mm/dd hh:mm:ss");

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
                <Text>
                  {" "}
                  {postDate}{" "}
                  {data.post.createdAt !== data.post.updatedAt
                    ? "(edited)"
                    : null}{" "}
                </Text>
              </Flex>

              <Flex align="center">
                <Text flex={1} mt={4}>
                  {data.post.text}
                </Text>
                <Box ml="auto"></Box>
              </Flex>

              <PostActions id={data.post.id} creatorId={data.post.creator.id} />
            </Box>
          </Flex>
        </Stack>
      </Layout>
    );
  }
};

export default withUrqlClient(urqlClient, { ssr: true })(Post);
