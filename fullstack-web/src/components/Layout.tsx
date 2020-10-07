import { ITheme } from "@chakra-ui/core";
import React, { createContext } from "react";
import { NavBar } from "./NavBar";
import { Wrapper, WrapperVariant } from "./Wrapper";
import { SideBar } from "./SideBar";
interface LayoutProps {
  variant?: WrapperVariant;
}

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

export const context = React.createContext<{
  value: boolean;
  changeValue: () => void;
}>(undefined!);

export const Layout: React.FC<LayoutProps> = ({ children, variant }) => {
  const [value, setValue] = React.useState(false);
  const changeValue = () => {
    setValue(!value);
  };

  return (
    <>
      <context.Provider value={{ value, changeValue }}>
        <NavBar />
        <Wrapper variant={variant}>{children}</Wrapper>
      </context.Provider>
    </>
  );
};
