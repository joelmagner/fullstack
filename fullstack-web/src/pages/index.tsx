import {
  Box,
  Button,
  CircularProgress,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { VoteSection } from "../components/VoteSection";
import { usePostsQuery } from "../generated/graphql";
import { urqlClient } from "../utils/urqlClient";
const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  if (!fetching && !data) {
    return (
      <div>
        <div>you got query failed for some reason</div>
        {/* <div>{error?.message}</div> */}
      </div>
    );
  }

  return (
    <Layout>
      {!data && fetching ? (
        <Layout>
          <Flex>
            <CircularProgress
              mt={1}
              size="512px"
              isIndeterminate
              color="green"
              justifyContent="center"
              alignItems="center"
              alignSelf="center"
            ></CircularProgress>
          </Flex>
        </Layout>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) =>
            !p ? null : (
              <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
                <VoteSection post={p} />
                <Box flex={1}>
                  <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                    <Link>
                      <Heading fontSize="xl">{p.title}</Heading>
                    </Link>
                  </NextLink>
                  <Flex>
                    <Text mr={1}>Posted by</Text>
                    <Text
                      style={{
                        textTransform: "capitalize",
                        fontWeight: "bold",
                      }}
                    >
                      {p.creator.username}
                    </Text>
                  </Flex>

                  <Flex align="center">
                    <Text flex={1} mt={4}>
                      {p.textSnippet}
                    </Text>
                    <Box ml="auto"></Box>
                  </Flex>
                </Box>
              </Flex>
            )
          )}
        </Stack>
      )}
      {data ? (
        <Flex>
          <Button
            isDisabled={!data.posts.hasMore}
            onClick={() =>
              setVariables({
                limit: 10,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            isLoading={fetching}
            m="auto"
            mt={8}
          >
            {data.posts.hasMore ? "load more" : "No more posts to be fetched"}
          </Button>
        </Flex>
      ) : null}
      <Box p={8}></Box>
    </Layout>
  );
};

export default withUrqlClient(urqlClient)(Index);
