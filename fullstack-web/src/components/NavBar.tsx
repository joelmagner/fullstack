import { Box, Button, DarkMode, Flex, Link } from "@chakra-ui/core";
import React from "react";
import NextLink from "next/link";
import {
  LogoutDocument,
  useLogoutMutation,
  useMeQuery,
} from "../generated/graphql";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = (props) => {
  const [{ data, fetching }] = useMeQuery();
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  let body = null;

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
          <Box mr={4}>{data.me.username}</Box>
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
