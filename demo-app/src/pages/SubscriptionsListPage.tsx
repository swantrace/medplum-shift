import React, { useState } from 'react';
import { Paper, Table, Group, Button, Text, Pagination } from '@mantine/core';
import { mockSubscriptions } from '../mockData';

export function SubscriptionsListPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const paged = mockSubscriptions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Paper p="md">
      <Group position="apart" mb="sm">
        <Text fw={500}>Subscriptions</Text>
        <Button size="xs">New</Button>
      </Group>
      <Table striped highlightOnHover withBorder>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Criteria</th>
            <th>Channel</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((s) => (
            <tr key={s.id} style={{ cursor: 'pointer' }}>
              <td>{s.id}</td>
              <td>{s.status}</td>
              <td>{s.criteria}</td>
              <td>{s.channel}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Group position="right" mt="sm">
        <Pagination total={1} value={page} onChange={setPage} size="sm" />
      </Group>
    </Paper>
  );
}
