import { ThemeProvider, CSSReset } from "@chakra-ui/core";

function MyApp({ Component, pageProps }: any) {
  return (
    <ThemeProvider>
      <CSSReset />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
