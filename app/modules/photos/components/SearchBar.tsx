import { TextInput, Button, Group } from "@mantine/core";
import { FiSearch, FiX } from "react-icons/fi";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  onClear,
  placeholder = "Search by hashtags...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onClear?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Group gap="xs">
      <TextInput
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        leftSection={<FiSearch size={16} />}
        rightSection={
          query && (
            <FiX
              size={16}
              style={{ cursor: "pointer" }}
              onClick={handleClear}
            />
          )
        }
        style={{ flex: 1 }}
      />
      <Button onClick={handleSearch} leftSection={<FiSearch size={16} />}>
        Search
      </Button>
    </Group>
  );
}
