import { Box, Input, InputGroup, InputLeftElement, VStack, Text, useColorModeValue } from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SearchItem {
  id: string;
  label: string;
  type: "log" | "mod";
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems: SearchItem[] = [
    { id: "1", label: "ERROR: NullPointerException", type: "log" },
    { id: "2", label: "FATAL: Mod loading failed", type: "log" },
    { id: "3", label: "architectury", type: "mod" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const filtered = allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  const inputBg = useColorModeValue("white", "gray.800");

  return (
    <Box position="relative">
      <InputGroup size="sm" w="200px">
        <InputLeftElement pointerEvents="none">
          <Search size={16} />
        </InputLeftElement>
        <Input
          ref={inputRef}
          placeholder="Ctrl+K 搜索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          bg={inputBg}
          borderRadius="lg"
        />
      </InputGroup>
      {isOpen && query && (
        <Box
          position="absolute"
          top="calc(100% + 8px)"
          left={0}
          w="300px"
          maxH="300px"
          overflowY="auto"
          bg={inputBg}
          borderRadius="lg"
          boxShadow="lg"
          zIndex={1000}
          p={2}
        >
          {results.length === 0 ? (
            <Text px={2} py={1} color="gray.500">无结果</Text>
          ) : (
            <VStack align="stretch" spacing={1}>
              {results.map(item => (
                <Box key={item.id} px={2} py={1} borderRadius="md" _hover={{ bg: "gray.100" }}>
                  <Text fontSize="sm">{item.label}</Text>
                  <Text fontSize="xs" color="gray.400">{item.type}</Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      )}
    </Box>
  );
}