import {
  Box,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Badge,
  Switch,
  useColorMode,
  Divider,   
  Button,    
} from "@chakra-ui/react";
import { useLogStore } from "../stores/logStore";
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useUIStore } from "../stores/uiStore";


const PAGE_SIZE_OPTIONS = [
  { value: 25, label: "25 条（推荐，流畅）", level: "safe" },
  { value: 50, label: "50 条（平衡）", level: "medium" },
  { value: 100, label: "100 条（⚠️ 可能卡顿）", level: "warning" },
];

export function SettingsPage() {
  const {
    pageSize,
    setPageSize,
    groupMaxDisplay,
    setGroupMaxDisplay,
  } = useLogStore();

  const { colorMode, toggleColorMode } = useColorMode();
  const { backgroundImage, setBackgroundImage, clearBackgroundImage } = useUIStore();

  const [showWarning, setShowWarning] = useState(false);
  const [showGroupWarning, setShowGroupWarning] = useState(false);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    setPageSize(value);
    if (value === 100) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
    } else {
      setShowWarning(false);
    }
  };

  const handleGroupMaxDisplayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    setGroupMaxDisplay(value);
    if (value === 0) {
      setShowGroupWarning(true);
      setTimeout(() => setShowGroupWarning(false), 5000);
    } else {
      setShowGroupWarning(false);
    }
  };
  const handleSelectBackground = async () => {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp"] }],
  });
  if (!selected) return;
  const assetUrl = convertFileSrc(selected); 
  setBackgroundImage(assetUrl);
	};

  const handleRemoveBackground = () => {
	clearBackgroundImage();
  };
  
  


  return (
    <Box>
      <Heading size="lg" mb={6}>
        ⚙️ 设置
      </Heading>

      <VStack spacing={6} align="stretch">
        {/* 显示设置 */}
        <Box
          p={6}
          bg={bg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Heading size="md" mb={4}>
            📺 显示设置
          </Heading>

          <FormControl>
            <FormLabel display="flex" alignItems="center" gap={2}>
              每页显示条数
              <Badge colorScheme="blue" fontSize="xs">
                影响性能
              </Badge>
            </FormLabel>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              maxW="300px"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Text fontSize="sm" color="gray.500" mt={2}>
              💡 选择较大的值可以查看更多日志，但可能会影响界面流畅度
            </Text>
          </FormControl>

          {showWarning && (
            <Alert status="warning" borderRadius="md" mt={4}>
              <AlertIcon />
              <AlertTitle>注意：</AlertTitle>
              <AlertDescription>
                显示 100 条日志可能会在日志较多时导致界面卡顿。
                如果遇到卡顿，建议切换到 25 或 50。
              </AlertDescription>
            </Alert>
          )}

          <FormControl mt={6}>
            <FormLabel display="flex" alignItems="center" gap={2}>
              分组每项最大显示
              <Badge colorScheme="purple" fontSize="xs">性能相关</Badge>
            </FormLabel>
            <Select
              value={groupMaxDisplay}
              onChange={handleGroupMaxDisplayChange}
              maxW="300px"
            >
              <option value={200}>200 条（推荐）</option>
              <option value={400}>400 条</option>
              <option value={500}>500 条</option>
              <option value={0}>全部（⚠️ 可能卡顿）</option>
            </Select>
            <Text fontSize="sm" color="gray.500" mt={2}>
              💡 控制每个分组展开后最多显示多少条日志，值越大越消耗性能。
            </Text>
          </FormControl>

          {showGroupWarning && (
            <Alert status="warning" borderRadius="md" mt={4}>
              <AlertIcon />
              <AlertTitle>注意：</AlertTitle>
              <AlertDescription>
                选择“全部”会在分组展开时尝试显示所有日志，若日志数量巨大（如数十万条）可能导致界面卡顿甚至崩溃。
                建议仅在日志总量较少时使用。
              </AlertDescription>
            </Alert>
          )}
        </Box>

{/* ===== 外观设置 ===== */}
<Box
  p={4}
  bg={bg}
  borderRadius="lg"
  borderWidth="1px"
  borderColor={borderColor}
>
  <Heading size="md" mb={4}>
    🎨 外观设置
  </Heading>

  <FormControl display="flex" alignItems="center">
    <FormLabel mb="0" htmlFor="color-mode-switch">
      深色模式
    </FormLabel>
    <Switch
      id="color-mode-switch"
      isChecked={colorMode === "dark"}
      onChange={toggleColorMode}
      colorScheme="purple"
    />
    <Text ml={3} fontSize="sm" color="gray.500">
      当前：{colorMode === "dark" ? "🌙 深色" : "☀️ 浅色"}
    </Text>
  </FormControl>

  <Divider my={4} />

  <VStack align="stretch" spacing={3}>
    <Text fontWeight="medium">背景图片（支持 GIF 动画）</Text>
    <HStack spacing={3}>
      <Button
        leftIcon={<span>🖼️</span>}
        onClick={handleSelectBackground}
        size="sm"
        colorScheme="blue"
      >
        选择图片
      </Button>
      {backgroundImage && (
        <Button
          size="sm"
          colorScheme="red"
          variant="outline"
          onClick={handleRemoveBackground}
        >
          移除背景
        </Button>
      )}
    </HStack>
    {backgroundImage && (
      <Box mt={2}>
        <Text fontSize="sm" color="gray.500">预览：</Text>
        <Box
          width="100%"
          height="80px"
          backgroundImage={`url(${backgroundImage})`}
          backgroundSize="cover"
          backgroundPosition="center"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          _dark={{ borderColor: "gray.600" }}
        />
      </Box>
    )}
  </VStack>
</Box>

        {/* 当前状态 */}
        <Box
          p={6}
          bg={bg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Heading size="md" mb={4}>
            📊 当前状态
          </Heading>
          <VStack align="stretch" spacing={2}>
            <HStack>
              <Text fontWeight="medium" w="160px">每页显示：</Text>
              <Text>{pageSize} 条</Text>
            </HStack>
            <HStack>
              <Text fontWeight="medium" w="160px">分组每项最大：</Text>
              <Text>{groupMaxDisplay === 0 ? "全部" : `${groupMaxDisplay} 条`}</Text>
            </HStack>
            <HStack>
              <Text fontWeight="medium" w="160px">总日志数：</Text>
              <Text>待导入</Text>
            </HStack>
            <HStack>
              <Text fontWeight="medium" w="160px">建议：</Text>
              <Text fontSize="sm" color="gray.500">
                {pageSize <= 25
                  ? "✅ 流畅模式，适合大量日志"
                  : pageSize <= 50
                  ? "⚖️ 平衡模式，适合中等日志量"
                  : "⚠️ 高性能模式，日志较多时可能卡顿"}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}