import { useState } from "react";
import {
  Box,
  Heading,
  Button,
  VStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  useToast,
  Flex,
} from "@chakra-ui/react";
import { useLogStore } from "../stores/logStore";
import { useModStore } from "../stores/modStore";
import { invokeTyped } from '../utils/tauri';
import { AnalysisResultSchema } from '../types/tauri.schema';
import { ZodError } from 'zod';
import { z } from 'zod';

export function AnalysisPage() {
  const { groups } = useLogStore();
  const { mods } = useModStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);


const handleAnalyze = async () => {
  if (!groups || groups.length === 0) {
    toast({
      title: "暂无日志数据",
      description: "请先在“日志列表”页面导入日志文件",
      status: "warning",
      duration: 3000,
    });
    return;
  }

  setLoading(true);
  setResults([]);
  setHasSearched(false);

  try {
    // 包装单个 
    const results = await invokeTyped(
      'analyze_crash',
      z.array(AnalysisResultSchema),
      { groups, mods }
    );
    setResults(results);
    setHasSearched(true);

    if (results.length === 0) {
      toast({
        title: "未分析到结果",
        description: "没有匹配到已知的错误模式",
        status: "info",
        duration: 2000,
      });
    }
  } 
  catch (error) {
    console.error('分析失败:', error);
    if (error instanceof ZodError) {
      toast({
        title: "分析结果格式异常",
        description: `后端返回的数据不符合约定: ${error.issues.map(e => e.message).join('; ')}`,
        status: "error",
        duration: 5000,
      });
    } else {
      toast({
        title: "分析失败",
        description: String(error),
        status: "error",
        duration: 5000,
      });
    }
  } finally {
    setLoading(false);
  }
};

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "red";
      case "Medium":
        return "orange";
      case "Low":
        return "yellow";
      default:
        return "gray";
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">🔍 分析报错</Heading>
        <Text fontSize="sm" color="gray.500">
          综合分析日志和模组库
        </Text>
      </Flex>

      <Button
        colorScheme="blue"
        onClick={handleAnalyze}
        isLoading={loading}
        loadingText="分析中..."
        mb={6}
      >
        {hasSearched ? "重新分析" : "开始分析"}
      </Button>

      {loading && (
        <Flex justify="center" align="center" h="150px">
          <Spinner size="xl" />
          <Text ml={4}>正在分析日志和模组库...</Text>
        </Flex>
      )}

      {hasSearched && !loading && results.length === 0 && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          未发现可识别的错误模式。请检查日志是否包含 ERROR 级别记录。
        </Alert>
      )}

      {hasSearched && !loading && results.length > 0 && (
        <VStack spacing={4} align="stretch">
          {results.map((r, idx) => (
            <Box
              key={idx}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              borderColor={`${getSeverityColor(r.severity)}.300`}
              bg={`${getSeverityColor(r.severity)}.50`}
              _dark={{ bg: `${getSeverityColor(r.severity)}.900` }}
            >
              <Badge colorScheme={getSeverityColor(r.severity)} mb={2}>
                {r.severity} 优先级
              </Badge>
              <Text fontWeight="bold" fontSize="md">
                {r.title}
              </Text>
              <Text fontSize="sm" mt={2}>
                <strong>建议：</strong>
                {r.suggestion}
              </Text>
              <Text
                fontSize="xs"
                color="gray.600"
                mt={2}
                fontFamily="monospace"
                bg="rgba(0,0,0,0.05)"
                p={2}
                borderRadius="md"
                maxH="80px"
                overflowY="auto"
                whiteSpace="pre-wrap"
                wordBreak="break-all"
              >
                相关日志：{r.detail}
              </Text>
            </Box>
          ))}
        </VStack>
      )}

      {!hasSearched && !loading && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          点击上方“开始分析”按钮，将自动扫描日志中的错误模式并匹配解决建议。
        </Alert>
      )}
    </Box>
  );
}