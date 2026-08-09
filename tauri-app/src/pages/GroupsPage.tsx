import { useState, useEffect } from "react";
import {
  Box, Heading, Accordion, AccordionItem, AccordionButton,
  AccordionPanel, AccordionIcon, Badge, Text, List, ListItem,
  IconButton, useToast, Button, useColorModeValue, Flex,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import { useLogStore } from "../stores/logStore";

const BATCH_SIZE = 20;

export function GroupsPage() {
  const { groups, expandedGroups, toggleGroup, groupMaxDisplay } = useLogStore();
  const toast = useToast();

  const [displayCounts, setDisplayCounts] = useState<Record<string, number>>({});
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    for (const g of groups) {
      initial[g.level] = Math.min(BATCH_SIZE, g.count);
    }
    setDisplayCounts(initial);
  }, [groups, groupMaxDisplay]);

  const copyGroup = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "已复制", status: "success", duration: 1500 });
  };

  const loadMore = (level: string, total: number) => {
    if (loadingMore[level]) return;
    setLoadingMore((prev) => ({ ...prev, [level]: true }));
    setTimeout(() => {
      setDisplayCounts((prev) => {
        const current = prev[level] || BATCH_SIZE;
        const maxDisplay = groupMaxDisplay === 0 ? total : Math.min(groupMaxDisplay, total);
        const next = Math.min(current + BATCH_SIZE, maxDisplay);
        return { ...prev, [level]: next };
      });
      setLoadingMore((prev) => ({ ...prev, [level]: false }));
    }, 50);
  };

  if (groups.length === 0) {
    return (
      <Box textAlign="center" py={10} color="gray.500">
        <Text fontSize="lg">暂无分组数据</Text>
        <Text>请先在日志列表页面导入日志</Text>
      </Box>
    );
  }

  const totalItems = groups.reduce((sum, g) => sum + g.count, 0);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">📂 分组归纳（{totalItems.toLocaleString()} 条）</Heading>
        <Text fontSize="sm" color="gray.500">
          {groupMaxDisplay === 0
            ? "📌 单组显示全部日志，注意性能"
            : `⚠️ 单组最多显示 ${groupMaxDisplay} 条，可在设置中调整`}
        </Text>
      </Flex>

      <Accordion
        allowMultiple
        index={groups
          .filter(g => g && g.level)
          .map((g) => (expandedGroups[g.level] ? groups.indexOf(g) : -1))
          .filter((i) => i >= 0)
        }
        onChange={(expandedIndexes) => {
          const expandedSet = new Set(expandedIndexes as number[]);
          for (const g of groups) {
            if (!g || !g.level) continue;
            const idx = groups.indexOf(g);
            const shouldExpand = expandedSet.has(idx);
            if (shouldExpand !== expandedGroups[g.level]) {
              toggleGroup(g.level);
            }
          }
        }}
      >
        {groups.filter(group => group && group.level).map((group) => {
          const displayCount = displayCounts[group.level] || Math.min(BATCH_SIZE, group.count);
          const maxDisplay = groupMaxDisplay === 0 ? group.count : Math.min(groupMaxDisplay, group.count);
          const hasMore = displayCount < maxDisplay;
          const isAtMax = displayCount >= maxDisplay && group.count > maxDisplay;
          const isLoading = loadingMore[group.level] || false;

          return (
            <AccordionItem key={group.level} border="1px solid" borderRadius="md" mb={2}>
              <AccordionButton _expanded={{ bg: "blue.50" }}>
                <Box flex="1" textAlign="left">
                  <Badge
                    colorScheme={
                      group.level === "ERROR" || group.level === "EXCEPTION" ? "red"
                      : group.level === "WARN" ? "orange"
                      : "blue"
                    }
                    fontSize="md"
                    mr={2}
                  >
                    {group.level}
                  </Badge>
                  <Text as="span" fontWeight="medium">
                    {group.count.toLocaleString()} 条
                  </Text>
                  {expandedGroups[group.level] && (
                    <Badge ml={2} colorScheme="green" fontSize="xs">
                      已展开
                    </Badge>
                  )}
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4} bg={useColorModeValue("gray.50", "gray.800")}>
                {expandedGroups[group.level] ? (
                  <>
                    <List spacing={2}>
                      {group.items.slice(0, displayCount).map((item, idx) => (
                        <ListItem
                          key={idx}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          p={2}
                          borderRadius="md"
                          bg="white"
                          _dark={{ bg: "gray.700" }}
                          borderWidth="1px"
                        >
                          <Text fontSize="sm" fontFamily="monospace" flex="1" wordBreak="break-all" maxH="60px" overflow="auto">
                            {item}
                          </Text>
                          <IconButton
                            icon={<CopyIcon />}
                            size="xs"
                            variant="ghost"
                            aria-label="复制"
                            onClick={() => copyGroup(item)}
                            ml={2}
                            flexShrink={0}
                          />
                        </ListItem>
                      ))}
                    </List>

                    {hasMore && (
                      <Button
                        size="sm"
                        mt={3}
                        onClick={() => loadMore(group.level, group.count)}
                        isLoading={isLoading}
                        loadingText="加载中..."
                      >
                        加载更多（{displayCount}/{maxDisplay}）
                      </Button>
                    )}
                    {isAtMax && (
                      <Text fontSize="sm" color="gray.500" mt={2}>
                        ⚠️ 已达到最大显示 {maxDisplay} 条，如需全部查看请调整设置
                      </Text>
                    )}
                  </>
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    点击展开查看（共 {group.count.toLocaleString()} 条）
                  </Text>
                )}
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Box>
  );
}