import { Box, Flex, HStack, IconButton, useColorModeValue } from "@chakra-ui/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LuMinus, LuX } from "react-icons/lu";
import { useCallback } from "react";

export function TitleBar() {
  const bg = useColorModeValue("whiteAlpha.800", "blackAlpha.800");
  const iconColor = useColorModeValue("gray.600", "gray.400");

  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;
    const appWindow = getCurrentWindow();
    await appWindow.startDragging();
  }, []);

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      h="48px"
      zIndex={999}
      onMouseDown={handleMouseDown}
      bg={bg}
      backdropFilter="blur(10px)"
      borderBottom="1px solid rgba(255,255,255,0.1)"
    >
      <Flex justify="space-between" align="center" h="full" px={4}>
        <Box fontSize="sm" fontWeight="medium" color={iconColor}>
          MC Log Tool
        </Box>
        <HStack spacing={1}>
          <IconButton
            icon={<LuMinus size={16} />}
            aria-label="最小化"
            variant="ghost"
            size="sm"
            color={iconColor}
            onClick={handleMinimize}
            _hover={{ bg: "gray.200" }}
          />
          <IconButton
            icon={<LuX size={16} />}
            aria-label="关闭"
            variant="ghost"
            size="sm"
            color={iconColor}
            onClick={handleClose}
            _hover={{ bg: "red.100", color: "red.600" }}
          />
        </HStack>
      </Flex>
    </Box>
  );
}