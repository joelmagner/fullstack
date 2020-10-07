import React, { useState } from "react";
import NextLink from "next/link";
import {
  useGetProfilePictureQuery,
  useLogoutMutation,
  useMeQuery,
} from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { useRouter } from "next/router";

import { context } from "./Layout";
import {
  Avatar,
  Box,
  Button,
  DarkMode,
  Flex,
  Heading,
  Icon,
  Text,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Switch,
  theme,
} from "@chakra-ui/core";
interface NavBarProps {}

// const config = (theme: ITheme) => ({
//   light: {
//     color: theme.colors.gray[700],
//     bg: theme.colors.gray[800],
//     borderColor: theme.colors.gray[200],
//     placeholderColor: theme.colors.gray[500],
//   },
//   dark: {
//     color: theme.colors.whiteAlpha[900],
//     bg: theme.colors.gray[800],
//     borderColor: theme.colors.whiteAlpha[300],
//     placeholderColor: theme.colors.whiteAlpha[400],
//   },
// });

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data }] = useMeQuery({
    pause: isServer(), // only run on client
  });
  const router = useRouter();
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data: profileData, fetching }] = useGetProfilePictureQuery({
    requestPolicy: "cache-first",
  });

  let body = null;
  let username = null;
  let avatar = <Avatar size="sm" mr={4} />;
  let profilePicture = null;
  const { value: collapsed, changeValue } = React.useContext(context);

  if (profileData?.getProfilePicture) {
    profilePicture = profileData?.getProfilePicture.imagePathname;
  }

  if (!data?.me) {
    // validating
    body = (
      <>
        <NextLink href="/login">
          <Button as={Link} mr={4} leftIcon="unlock">
            Login
          </Button>
        </NextLink>
        <NextLink href="/register">
          <Button as={Link} leftIcon="plus-square">
            Register
          </Button>
        </NextLink>
      </>
    );
  } else {
    body = (
      <>
        <Box
          mr={4}
          color={"gray.300"}
          fontWeight="bold"
          alignSelf="center"
        ></Box>
        <NextLink href="/create-post">
          <Button as={Link} mr={4} leftIcon="add">
            Create Post
          </Button>
        </NextLink>
      </>
    );
    username =
      data.me.username.charAt(0).toUpperCase() + data.me.username.slice(1);
    // logged in
  }

  // // Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.
  // //   in Avatar (at NavBar.tsx:107)
  // //   in button (created by Context.Consumer)
  // //   in PseudoBox (created by Button)
  // //   in Button (created by MenuButton)
  // //   in MenuButton (at NavBar.tsx:157)
  // //   in Menu (at NavBar.tsx:156)
  // //   in div (created by Context.Consumer)
  // //   in Box (created by Flex)
  // //   in Flex (at NavBar.tsx:129)
  // //   in ColorModeProvider (created by DarkMode)
  // //   in DarkMode (at NavBar.tsx:128)
  // //   in NavBar (at Layout.tsx:28)
  // //   in Layout (at PostFeed.tsx:41)

  if (profileData?.getProfilePicture?.filename && data?.me && !fetching) {
    avatar = (
      <Avatar
        size="sm"
        name={data.me.username}
        background="transparent"
        src={
          profilePicture != null
            ? `http://localhost:4000/${profilePicture}`
            : undefined
        }
        mr={4}
      />
    );
  } else if (
    data?.me &&
    !fetching &&
    !profileData?.getProfilePicture?.filename
  ) {
    avatar = <Avatar size="sm" name={data.me.username} mr={4} />;
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
        alignItems="center"
      >
        <Flex flex={1} m="auto" align="center">
          {router.pathname !== "/" ? (
            <NextLink href="/">
              <Link>
                <IconButton
                  icon="arrow-left"
                  aria-label="Go Back"
                  mr={4}
                ></IconButton>
              </Link>
            </NextLink>
          ) : null}
          <Heading fontSize={24}>Fullstack</Heading>
          <Box ml={"auto"} display="flex">
            {body}
          </Box>
        </Flex>
        {username ? (
          <Menu>
            <MenuButton
              as={Button}
              alignContent="center"
              verticalAlign="center"
            >
              {avatar}
              <Text lineHeight="1" style={{ color: "gray" }}>
                {username}
              </Text>
            </MenuButton>
            <MenuList>
              <MenuGroup title="Profile">
                <MenuItem>
                  <NextLink
                    href="/profile/[id]"
                    as={`/profile/${data?.me?.username}`}
                  >
                    <Link mr={4} aria-label="My Account">
                      My Account
                    </Link>
                  </NextLink>
                </MenuItem>
                <MenuItem>Payments </MenuItem>
              </MenuGroup>
              <MenuDivider />
              <MenuGroup title="Theme">
                <MenuItem
                  verticalAlign="center"
                  onClick={(e: any) => e.preventDefault()}
                >
                  Night Mode <Switch ml={4} size="sm" defaultIsChecked={true} />
                </MenuItem>
              </MenuGroup>
              <MenuDivider />
              <MenuGroup title="Help">
                <MenuItem>Docs</MenuItem>
                <MenuItem>FAQ</MenuItem>
              </MenuGroup>
              <MenuDivider />
              <MenuItem>
                <NextLink href="/">
                  <Link
                    onClick={async () => {
                      await logout();
                      router.reload();
                    }}
                    isExternal={logoutFetching}
                  >
                    <Icon name="external-link" mr={2}></Icon> Logout
                  </Link>
                </NextLink>
              </MenuItem>
            </MenuList>
          </Menu>
        ) : null}
      </Flex>
    </DarkMode>
  );
};
