import React, { useRef } from 'react';
import { Paper, Group, Text, Button, Stack, Textarea, FileInput } from '@mantine/core';

export function BatchOperationsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [json, setJson] = React.useState('');

  return (
    <Paper p="md" maw={700} mx="auto">
      <Stack gap="lg">
        <Text fw={500}>Batch Operations</Text>
        <Group align="flex-start" gap="xl" noWrap>
          {/* File upload section */}
          <Stack gap="xs" w={300}>
            <Text>Upload JSON File</Text>
            <FileInput ref={fileRef} placeholder="Choose file" disabled />
            <Button size="xs" disabled>
              Upload
            </Button>
          </Stack>
          {/* JSON paste section */}
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text>Paste JSON</Text>
            <Textarea
              minRows={8}
              value={json}
              onChange={(e) => setJson(e.currentTarget.value)}
              autosize
              spellCheck={false}
              placeholder="Paste FHIR Bundle JSON here"
              styles={{ input: { fontFamily: 'monospace' } }}
            />
            <Button size="xs" disabled>
              Submit
            </Button>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
}
