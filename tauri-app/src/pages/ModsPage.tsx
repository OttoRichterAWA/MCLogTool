import { useState } from "react";
import {
  Box,
  Heading,
  Button,
  Text,
  List,
  ListItem,
  useToast,
  Spinner,
  HStack,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { CopyIcon, DeleteIcon } from "@chakra-ui/icons";
import { open } from "@tauri-apps/plugin-dialog";
import { useModStore } from "../stores/modStore";
import { invokeTyped } from '../utils/tauri';
import { ScanModsResponseSchema } from '../types/tauri.schema';
import { ZodError } from 'zod';


export function ModsPage() {
  const { mods, loading, addMods, clearMods, setLoading } = useModStore();
  const toast = useToast();
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScannedPath, setLastScannedPath] = useState<string>("");


const scanMods = async () => {
  const selected = await open({
    directory: true,
    multiple: false,
  });
  if (!selected) {
    console.log("用户取消了文件夹选择");
    return;
  }

  setLastScannedPath(selected);
  setLoading(true);
  setScanError(null);

  try {
    const result = await invokeTyped(
      'scan_minecraft_mods',
      ScanModsResponseSchema,
      { path: selected }
    );
    addMods(result);

    toast({
      title: "✅ 扫描成功",
      description: `找到 ${result.length} 个模组，已添加到库（共 ${mods.length + result.length} 个）`,
      status: "success",
      duration: 3000,
    });
  } 
  catch (error) {
    const errMsg = String(error);
    setScanError(errMsg);
    console.error("扫描模组失败:", error);

    if (error instanceof ZodError) {
      toast({
        title: "模组列表格式异常",
        description: `后端返回的数据不是有效的字符串数组: ${error.issues.map(e => e.message).join('; ')}`,
        status: "error",
        duration: 5000,
      });
    } else {
      toast({
        title: "❌ 扫描失败",
        description: errMsg,
        status: "error",
        duration: 5000,
      });
    }
  } finally {
    setLoading(false);
  }
};

  const copyMod = (name: string) => {
    navigator.clipboard.writeText(name);
    toast({ title: "已复制", status: "success", duration: 1500 });
  };

  const handleClear = () => {
    clearMods();
    toast({ title: "已清空模组库", status: "info" });
  };

  const bg = useColorModeValue("white", "gray.800");

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">🧩 模组管理</Heading>
        <Text fontSize="sm" color="gray.500">
          模组库 · {mods.length} 个模组
        </Text>
      </Flex>

      <HStack mb={4} spacing={3} flexWrap="wrap">
        <Button
          colorScheme="blue"
          onClick={scanMods}
          isLoading={loading}
          loadingText="扫描中..."
          leftIcon={<span>📂</span>}
        >
          选择 .minecraft 目录并扫描
        </Button>
        <Button
          colorScheme="red"
          variant="outline"
          onClick={handleClear}
          isDisabled={mods.length === 0}
          leftIcon={<DeleteIcon />}
        >
          清空模组库
        </Button>
        {lastScannedPath && (
          <Text fontSize="sm" color="gray.500">
            上次扫描：{lastScannedPath}
          </Text>
        )}
      </HStack>

      {scanError && (
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          <AlertTitle>扫描出错：</AlertTitle>
          <AlertDescription>{scanError}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Flex justify="center" align="center" h="150px">
          <Spinner size="xl" />
          <Text ml={4}>正在扫描 mods 文件夹...</Text>
        </Flex>
      )}

      {!loading && mods.length > 0 && (
        <Box
          borderWidth="1px"
          borderRadius="lg"
          borderColor="gray.200"
          p={4}
          bg={bg}
        >
          <Text fontWeight="medium" mb={2}>
            📋 模组库（共 {mods.length} 个，去重后）
          </Text>
          <List spacing={1} maxH="500px" overflowY="auto">
            {mods.map((name, idx) => (
              <ListItem
                key={idx}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={2}
                borderRadius="md"
                _hover={{ bg: "gray.100" }}
                _dark={{ bg: "gray.700", borderColor: "gray.600" }} 
                borderBottomWidth="1px"
                borderColor="gray.100"
              >
                <Text fontSize="sm" fontFamily="monospace">
                  {name}
                </Text>
                <Tooltip label="复制名称">
                  <IconButton
                    icon={<CopyIcon />}
                    size="xs"
                    variant="ghost"
                    aria-label="复制"
                    onClick={() => copyMod(name)}
                  />
                </Tooltip>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {!loading && mods.length === 0 && !scanError && (
        <Box textAlign="center" py={10} color="gray.500">
          <Text fontSize="lg">模组库为空</Text>
          <Text>点击“选择 .minecraft 目录并扫描”添加模组</Text>
        </Box>
      )}
    </Box>
  );
}