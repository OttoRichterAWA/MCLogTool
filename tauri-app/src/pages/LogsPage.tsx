import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Spinner,
  Flex,
  Input,
  IconButton,
  Tooltip,
  Text,
  HStack,
  Select,
  Progress,
  VStack,
} from "@chakra-ui/react";
import { open } from "@tauri-apps/plugin-dialog";
import { useLogStore } from "../stores/logStore";
import { invokeTyped } from '../utils/tauri';
import { ParseLogsResponseSchema, ParseFolderResponseSchema } from '../types/tauri.schema';
import { ZodError } from 'zod';
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";

export function LogsPage() {
  const {
    currentPageData,
    total,
    loading,
    filter,
    currentPage,
    pageSize,
    setFilter,
    setCurrentPage,
    setPageSize,
    importLogs,
    refreshCurrentPage,
    importProgress,
    setLoading, 
    setImportProgress, 
  } = useLogStore();

  const toast = useToast();
  const [localFilter, setLocalFilter] = useState(filter);

  useEffect(() => {
    refreshCurrentPage();
  }, []);

  // ===== 导入单个日志文件 =====
  const importLog = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Log files", extensions: ["log", "txt", "zip"] }],
    });
    if (!selected) return;

    try {
      const data = await invokeTyped('parse_logs', ParseLogsResponseSchema, { path: selected });
      await importLogs(data.logs);
      toast({
        title: "导入成功",
        description: `找到 ${data.logs.length} 条日志`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        toast({
          title: "数据格式异常",
          description: `后端返回的数据结构不符合预期: ${error.issues.map(e => e.message).join('; ')}`,
          status: "error",
          duration: 5000,
        });
      } else {
        toast({
          title: "导入失败",
          description: String(error),
          status: "error",
          duration: 5000,
        });
      }
    }
  };

  // ===== 导入文件夹 =====
  const importFolder = async () => {
    try {
      const folder = await open({
        directory: true,
        multiple: false,
      });
      if (!folder) {
        console.log("用户取消了文件夹选择");
        return;
      }

      console.log(`正在扫描文件夹: ${folder}`);

      setLoading(true);
      setImportProgress(0);
      await new Promise(resolve => setTimeout(resolve, 50));

      const data = await invokeTyped('parse_folder', ParseFolderResponseSchema, { path: folder });

      await importLogs(data.logs);

      toast({
        title: "✅ 导入成功",
        description: `找到 ${data.logs.length} 条日志，处理了 ${data.processed_files} 个文件`,
        status: "success",
        duration: 4000,
      });
    } catch (error) {
      console.error("导入文件夹失败:", error);
      if (error instanceof ZodError) {
        toast({
          title: "数据格式异常",
          description: `后端返回的数据结构不符合预期: ${error.issues.map(e => e.message).join('; ')}`,
          status: "error",
          duration: 5000,
        });
      } else {
        toast({
          title: "❌ 导入失败",
          description: String(error),
          status: "error",
          duration: 5000,
        });
      }
    }
  };

  // ===== 复制日志 =====
  const copyLog = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "已复制", status: "success", duration: 1500 });
  };

  // ===== 导出日志 =====
  const exportLogs = () => {
    const content = currentPageData.map(log => `${log.time} [${log.level}] ${log.content}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== 过滤处理 =====
  const handleFilterChange = (value: string) => {
    setLocalFilter(value);
    setFilter(value);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <Box>
      <Flex mb={2} gap={2} flexWrap="wrap" align="center">
        <Button colorScheme="purple" onClick={importFolder} isLoading={loading} leftIcon={<span>📁</span>}>
          导入文件夹
        </Button>
        <Button colorScheme="blue" onClick={importLog} isLoading={loading} leftIcon={<span>📂</span>}>
          导入日志
        </Button>
        <Button colorScheme="green" onClick={exportLogs} isDisabled={currentPageData.length === 0} leftIcon={<DownloadIcon />}>
          导出
        </Button>

        <Input
          placeholder="过滤日志..."
          value={localFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          width="250px"
        />
        <HStack spacing={2} ml="auto">
          <Text fontSize="sm" color="gray.500">
            共 {total} 条
          </Text>
          <Select
            size="sm"
            width="80px"
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value))}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </HStack>
      </Flex>

      {loading ? (
        <Box p={8}>
          <VStack spacing={4} align="center">
            <Spinner
              size="xl"
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
            />
            <Text fontSize="lg" fontWeight="medium">
              {importProgress === 0 ? "正在解析日志文件，请稍候..." : "正在导入日志，请稍候..."}
            </Text>
            {importProgress > 0 ? (
              <>
                <Progress
                  value={importProgress}
                  size="lg"
                  width="400px"
                  colorScheme="blue"
                  hasStripe
                  isAnimated
                  borderRadius="md"
                />
                <Text fontSize="sm" color="gray.500">
                  {importProgress}%
                </Text>
              </>
            ) : (
              <Text fontSize="sm" color="gray.500">
                准备数据中...
              </Text>
            )}
          </VStack>
        </Box>
      ) : currentPageData.length === 0 ? (
        <Box textAlign="center" py={10} color="gray.500">
          <Text fontSize="lg">暂无日志</Text>
          <Text>点击“导入日志”按钮加载日志文件</Text>
        </Box>
      ) : (
        <>
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th width="180px">时间</Th>
                  <Th width="100px">级别</Th>
                  <Th>内容</Th>
                  <Th width="80px">操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentPageData.map((log, index) => (
                  <Tr key={`${log.time}-${index}`}>
                    <Td fontSize="sm">{log.time}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          log.level === "ERROR" || log.level === "FATAL"
                            ? "red"
                            : log.level === "WARN"
                            ? "orange"
                            : "blue"
                        }
                      >
                        {log.level}
                      </Badge>
                    </Td>
                    <Td fontSize="sm" fontFamily="monospace" whiteSpace="pre-wrap" wordBreak="break-all">
                      {log.content}
                    </Td>
                    <Td>
                      <Tooltip label="复制">
                        <IconButton
                          icon={<CopyIcon />}
                          size="xs"
                          variant="ghost"
                          aria-label="复制"
                          onClick={() => copyLog(log.content)}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          <Flex justify="space-between" align="center" mt={4}>
            <Text fontSize="sm" color="gray.500">
              第 {currentPage} / {totalPages} 页
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                isDisabled={currentPage <= 1}
              >
                上一页
              </Button>
              <Button
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                isDisabled={currentPage >= totalPages}
              >
                下一页
              </Button>
            </HStack>
          </Flex>
        </>
      )}
    </Box>
  );
}