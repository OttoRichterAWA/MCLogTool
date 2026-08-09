import { ChakraProvider, extendTheme, Flex, Text } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { BackgroundProvider } from "./contexts/background-context";
import { ThemeColorProvider } from "./contexts/theme-color-context";
import { MainLayout } from "./components/ui/MainLayout";
import { AnimatedPage } from "./components/ui/AnimatedPage";
import { LogsPage } from "./pages/LogsPage";
import { GroupsPage } from "./pages/GroupsPage";
import { ModsPage } from "./pages/ModsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AnalysisPage } from "./pages/AnalysisPage";   

function HomePage() {
  return (
    <Flex
      height="100%"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <Text fontSize="2xl" fontWeight="bold">欢迎使用 MC 日志分析工具</Text>
      <Text fontSize="md" color="gray.500">请从侧边栏选择功能开始</Text>
    </Flex>
  );
}

const theme = extendTheme({
  colors: { brand: { 500: "#6366f1" } },
  styles: {
    global: {
      body: { bg: "gray.50" },
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <ThemeColorProvider>
          <BackgroundProvider>
            <BrowserRouter>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
                  <Route path="/logs" element={<AnimatedPage><LogsPage /></AnimatedPage>} />
                  <Route path="/groups" element={<AnimatedPage><GroupsPage /></AnimatedPage>} />
                  <Route path="/analysis" element={<AnimatedPage><AnalysisPage /></AnimatedPage>} />
                  <Route path="/mods" element={<AnimatedPage><ModsPage /></AnimatedPage>} />
                  <Route path="/settings" element={<AnimatedPage><SettingsPage /></AnimatedPage>} />
                </Routes>
              </MainLayout>
            </BrowserRouter>
          </BackgroundProvider>
        </ThemeColorProvider>
      </I18nextProvider>
    </ChakraProvider>
  );
}

export default App;