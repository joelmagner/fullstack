import { Box, Button, Flex, Link } from "@chakra-ui/core";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = (props) => {
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(), // only run on client
  });
  console.log("is me query", data, fetching);
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  let body = null;

  if (fetching) {
    console.log("fetching", data);
  }

  if (!data?.me) {
    // validating
    body = (
      <>
        <NextLink href="/login">
          <Link mr={4}>Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>Register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <>
        <Flex>
          <Box mr={4}>
            {data.me.username.charAt(0).toUpperCase() +
              data.me.username.slice(1)}
          </Box>
          <Button
            onClick={() => logout()}
            isLoading={logoutFetching}
            variant="link"
          >
            Logout
          </Button>
        </Flex>
      </>
    );
    // logged in
  }
  return (
    <Flex bg="Gray" p={4}>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
