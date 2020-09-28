import {
  Box,
  Button,
  DarkMode,
  Flex,
  ITheme,
  Link,
  theme,
} from "@chakra-ui/core";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

const config = (theme: ITheme) => ({
  light: {
    color: theme.colors.gray[700],
    bg: theme.colors.gray[800],
    borderColor: theme.colors.gray[200],
    placeholderColor: theme.colors.gray[500],
  },
  dark: {
    color: theme.colors.whiteAlpha[900],
    bg: theme.colors.gray[800],
    borderColor: theme.colors.whiteAlpha[300],
    placeholderColor: theme.colors.whiteAlpha[400],
  },
});

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data }] = useMeQuery({
    pause: isServer(), // only run on client
  });
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
        <Box mr={4}>
          <NextLink href="/create-post">
            <Link>Create Post</Link>
          </NextLink>
        </Box>
        <Flex>
          <Box mr={4} color={"gray.300"} fontWeight="bold">
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
    <DarkMode>
      <Flex
        position="sticky"
        zIndex={1}
        bg={theme.colors.gray[800]}
        top={0}
        p={4}
        borderBottom={"1px solid black"}
      >
        <Box ml={"auto"} display="flex">
          {body}
        </Box>
      </Flex>
    </DarkMode>
  );
};
