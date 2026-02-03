import { useState } from "react";
import { Button, Stack, Text } from "@mantine/core";

export default function Test() {
  const [count, setCount] = useState(0);

  return (
    <Stack>
      <Text size="xl">Test Page - Count: {count}</Text>
      <Button onClick={() => setCount(count + 1)}>
        Click Me
      </Button>
      <Button onClick={() => console.log("Console test")}>
        Test Console
      </Button>
      <Button onClick={() => alert("Alert test")}>
        Test Alert
      </Button>
    </Stack>
  );
}
