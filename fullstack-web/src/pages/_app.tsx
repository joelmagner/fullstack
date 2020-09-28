import {
  ThemeProvider,
  CSSReset,
  ITheme,
  DarkMode,
  useColorMode,
} from "@chakra-ui/core";
import theme from "../theme";

function MyApp({ Component, pageProps }: any) {
  return (
    <ThemeProvider theme={theme}>
      <DarkMode>
        <CSSReset />
        <Component {...pageProps} />
      </DarkMode>
    </ThemeProvider>
  );
}

export default MyApp;
