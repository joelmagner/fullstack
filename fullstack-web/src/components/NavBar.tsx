import {
  Avatar,
  Box,
  Button,
  DarkMode,
  Flex,
  Heading,
  Icon,
  IconButton,
  ITheme,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Switch,
  Text,
  theme,
} from "@chakra-ui/core";
import React from "react";
import NextLink from "next/link";
import {
  AddProfilePictureDocument,
  useGetProfilePictureQuery,
  useLogoutMutation,
  useMeQuery,
} from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data: profileData, fetching }] = useGetProfilePictureQuery({
    requestPolicy: "cache-first",
  });
  let body = null;
  let username = null;
  let avatar = null;
  let profilePicture = null;

  if (profileData?.getProfilePicture) {
    profilePicture = profileData?.getProfilePicture.filename;
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
    username = (
      <div style={{ color: "gray" }}>
        {data.me.username.charAt(0).toUpperCase() + data.me.username.slice(1)}
      </div>
    );
    // logged in
  }

  if (profileData?.getProfilePicture?.filename && data?.me) {
    avatar = (
      <Avatar
        size="sm"
        name={data.me.username}
        background="transparent"
        src={
          profilePicture != null
            ? `http://localhost:4000/attachments/profile/${profilePicture}`
            : undefined
        }
        mr={4}
      />
    );
  } else if (data?.me) {
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
              <Text lineHeight="1">{username}</Text>
            </MenuButton>
            <MenuList>
              <MenuGroup title="Profile">
                <MenuItem>My Account</MenuItem>
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
