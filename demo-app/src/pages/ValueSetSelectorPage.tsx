import React, { useState } from 'react';
import { Paper, Group, Text, Button, Stack, TextInput, List, Textarea, ScrollArea } from '@mantine/core';
import { mockValueSetSuggestions, mockValueSetExample } from '../mockData';

export function ValueSetSelectorPage() {
  const [json, setJson] = useState(mockValueSetExample);
  const [search, setSearch] = useState('');

  return (
    <Group align="flex-start" spacing="lg" noWrap>
      {/* Left: Search Suggestions */}
      <Paper p="md" w={300} withBorder>
        <Stack>
          <Text fw={500}>Search ValueSets</Text>
          <TextInput placeholder="Search ValueSets" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
          <List spacing="xs" mt="sm">
            {mockValueSetSuggestions
              .filter((s) => !search || s.includes(search.toLowerCase()))
              .map((s) => (
                <List.Item key={s}>{s}</List.Item>
              ))}
          </List>
        </Stack>
      </Paper>
      {/* Right: JSON Editor */}
      <Paper p="md" style={{ flex: 1 }} withBorder>
        <Stack>
          <Text fw={500}>Create ValueSet (JSON)</Text>
          <ScrollArea h={220}>
            <Textarea
              minRows={10}
              value={json}
              onChange={(e) => setJson(e.currentTarget.value)}
              autosize
              spellCheck={false}
              styles={{ input: { fontFamily: 'monospace' } }}
            />
          </ScrollArea>
          <Button size="xs">Create ValueSet</Button>
        </Stack>
      </Paper>
    </Group>
  );
}
