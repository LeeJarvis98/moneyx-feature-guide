'use client';

import { CoreCombination } from '@/types';
import { Paper, Text, Stack, List, Alert, Group } from '@mantine/core';
import { Lightbulb, Zap, CheckCircle } from 'lucide-react';

interface InsightPanelProps {
  combination: CoreCombination | null;
}

export function InsightPanel({ combination }: InsightPanelProps) {
  if (!combination || combination.cards.length === 0) {
    return (
      <Paper withBorder p="xl" radius="md" bg="gray.0">
        <Stack align="center" gap="md" py="xl">
          <Lightbulb size={48} color="gray" />
          <Text size="lg" c="dimmed" ta="center">
            Select cards to see combination insights
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Add multiple cards to the core to unlock powerful synergies
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Alert icon={<Zap size={20} />} title={combination.insight} color="blue" variant="light">
        <Text size="sm">{combination.synergy}</Text>
      </Alert>

      <Paper withBorder p="lg" radius="md">
        <Stack gap="md">
          <Group gap="xs">
            <CheckCircle size={20} color="green" />
            <Text fw={600} size="lg">
              Benefits
            </Text>
          </Group>

          <List spacing="sm" size="sm" center icon={<CheckCircle size={16} color="green" />}>
            {combination.benefits.map((benefit, index) => (
              <List.Item key={index}>{benefit}</List.Item>
            ))}
          </List>
        </Stack>
      </Paper>
    </Stack>
  );
}
