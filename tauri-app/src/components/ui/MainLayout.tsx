import { Box } from "@chakra-ui/react";
import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { useUIStore } from "../../stores/uiStore";

export function MainLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { backgroundImage } = useUIStore();
  const isHome = location.pathname === "/";

  // 控制全局滚动和滚轮事件
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isHome) {
        e.preventDefault();
      }
    };

    if (isHome) {
      // 禁用全局滚动
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      // 阻止滚轮事件
      window.addEventListener("wheel", handleWheel, { passive: false });
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("wheel", handleWheel);
    }

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("wheel", handleWheel);
    };
  }, [isHome]);

  // 路由切换滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const contentStyles = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {};

  return (
    <Box minHeight="100vh">
      <TitleBar />
      <Sidebar />
      <Box
        ml="200px"
        marginTop="48px"
        p={6}
        minHeight="calc(100vh - 48px)"
        overflow={isHome ? "hidden" : "auto"}   
        bg={backgroundImage ? undefined : "gray.50"}
        {...contentStyles}
      >
        {children}
      </Box>
    </Box>
  );
}