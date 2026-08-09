import { Flex } from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Box,
  Badge,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLogStore } from "../stores/logStore";
import { useModStore } from "../stores/modStore";

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalysisModal({ isOpen, onClose }: AnalysisModalProps) {
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
      const result: any[] = await invoke("analyze_crash", {
        groups: groups,
        mods: mods || [],
      });
      setResults(result);
      setHasSearched(true);
      if (result.length === 0) {
        toast({
          title: "未分析到结果",
          description: "没有匹配到已知的错误模式",
          status: "info",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "分析失败",
        description: String(error),
        status: "error",
        duration: 5000,
      });
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>🔍 分析崩溃原因</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.500" mb={4}>
            综合分析“分组归纳”中的错误日志和“模组管理”中的模组库，生成可能的原因和建议。
          </Text>

          {!hasSearched && !loading && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              点击下方“开始分析”按钮，将自动扫描日志中的错误模式并匹配解决建议。
            </Alert>
          )}

          {loading && (
            <Flex justify="center" align="center" py={8}>
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
            <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto" pr={1}>
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
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={handleAnalyze}
            isLoading={loading}
            loadingText="分析中..."
            mr={3}
          >
            {hasSearched ? "重新分析" : "开始分析"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            关闭
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}