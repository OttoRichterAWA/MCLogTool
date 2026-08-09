import { VStack, Text, Button, useColorModeValue } from "@chakra-ui/react";
import { Home, FileText, FolderTree, Search, Package, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const navItems = [
  { path: "/", icon: Home, labelKey: "sidebar.home" },
  { path: "/logs", icon: FileText, labelKey: "sidebar.logs" },
  { path: "/groups", icon: FolderTree, labelKey: "sidebar.groups" },
  { path: "/analysis", icon: Search, labelKey: "sidebar.analysis" },   
  { path: "/mods", icon: Package, labelKey: "sidebar.mods" },
  { path: "/settings", icon: Settings, labelKey: "sidebar.settings" },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const bg = useColorModeValue("gray.800", "gray.900");
  const activeBg = useColorModeValue("gray.700", "gray.600");

  return (
    <VStack
      w="200px"
      h="100vh"
      bg={bg}
      color="white"
      p={4}
      spacing={2}
      align="stretch"
      flexShrink={0}
      position="fixed"
      left={0}
      top={0}
      zIndex={10}
    >
      <Text fontSize="xl" fontWeight="bold" mb={4} textAlign="center">
        📊 MC Log Tool
      </Text>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant="ghost"
              colorScheme="white"
              justifyContent="flex-start"
              leftIcon={<item.icon size={18} />}
              w="100%"
              bg={isActive ? activeBg : "transparent"}
              _hover={{ bg: activeBg }}
              fontWeight={isActive ? "bold" : "normal"}
            >
              {t(item.labelKey)}
            </Button>
          </Link>
        );
      })}
    </VStack>
  );
}