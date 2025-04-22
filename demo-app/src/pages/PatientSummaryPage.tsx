import React, { useState } from 'react';
import { Paper, Group, Text, Stack, Badge, Tabs, Button, Table, Select } from '@mantine/core';
import { useParams, useNavigate } from 'react-router';
import { mockPatients, mockConditions, mockEncounters } from '../mockData';

export function PatientSummaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = mockPatients.find((p) => p.id === id) || mockPatients[0];
  const [activeTab, setActiveTab] = useState('Condition');
  const [showAddType, setShowAddType] = useState(false);
  const resourceTypes = ['Condition', 'Encounter'];
  const [tabs, setTabs] = useState(resourceTypes);

  // For demo, always show all mock data for selected tab
  const resourceData = activeTab === 'Condition' ? mockConditions : mockEncounters;

  return (
    <Group align="flex-start" wrap="nowrap">
      {/* Left: Patient Info */}
      <Paper p="md" w={320} withBorder>
        <Stack gap="xs">
          <Text fw={700} size="lg">
            {patient.name}
          </Text>
          <Text>Birth Date: {patient.birthDate}</Text>
          <Text>Age: {new Date().getFullYear() - Number(patient.birthDate.slice(0, 4))}</Text>
          <Text>
            Gender:{' '}
            <Badge color={patient.gender === 'male' ? 'blue' : patient.gender === 'female' ? 'pink' : 'gray'}>
              {patient.gender}
            </Badge>
          </Text>
          <Text>Status: {patient.status}</Text>
          <Text c="dimmed" mt="md">
            No upcoming appointments
          </Text>
        </Stack>
      </Paper>
      {/* Right: Resource Tabs */}
      <Paper p="md" style={{ flex: 1 }} withBorder>
        <Tabs
          value={activeTab}
          onChange={(value) => {
            if (value) {
              setActiveTab(value);
            }
          }}
        >
          <Tabs.List>
            {tabs.map((type) => (
              <Tabs.Tab key={type} value={type}>
                {type}
              </Tabs.Tab>
            ))}
            <Tabs.Tab value="add" onClick={() => setShowAddType((v) => !v)}>
              +
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
        {showAddType && (
          <Select
            data={['AllergyIntolerance']}
            placeholder="Add resource type"
            onChange={(val) => {
              if (val && !tabs.includes(val)) setTabs([...tabs, val]);
              setShowAddType(false);
            }}
            mt="xs"
            maw={200}
          />
        )}
        <Group mt="md" mb="xs">
          <Text fw={500}>{activeTab} List</Text>
          <Button size="xs" onClick={() => {}}>
            Add New
          </Button>
        </Group>
        <Table striped highlightOnHover border={1}>
          <thead>
            <tr>
              <th>Summary</th>
              <th>Date</th>
              <th>Security Labels</th>
            </tr>
          </thead>
          <tbody>
            {resourceData.map((r) => (
              <tr
                key={r.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/${activeTab.toLowerCase()}/${r.id}/edit`)}
              >
                <td style={{ textAlign: 'center' }}>{r.summary}</td>
                <td style={{ textAlign: 'center' }}>{r.date}</td>
                <td style={{ textAlign: 'center' }}>
                  {r.securityLabels && r.securityLabels.length > 0 ? (
                    r.securityLabels.map((label) => (
                      <Badge
                        key={label}
                        color={label === 'R' ? 'red' : 'blue'}
                        leftSection={label === 'R' ? '🔒' : undefined}
                        mr={4}
                        title={label === 'R' ? 'Restricted' : label}
                      >
                        {label}
                      </Badge>
                    ))
                  ) : (
                    <Text c="dimmed" size="xs">
                      None
                    </Text>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Paper>
    </Group>
  );
}
