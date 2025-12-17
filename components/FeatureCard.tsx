'use client';

import { Card as CardType } from '@/types';
import { Card, Text, Badge, Group, Stack } from '@mantine/core';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  card: CardType;
  onClick: () => void;
  isSelected?: boolean;
}

export function FeatureCard({ card, onClick, isSelected }: FeatureCardProps) {
  const IconComponent = (Icons[card.icon as keyof typeof Icons] as LucideIcon) || Icons.HelpCircle;

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        cursor: 'pointer',
        borderColor: isSelected ? card.color : undefined,
        borderWidth: isSelected ? 2 : 1,
        transition: 'all 0.2s ease',
        backgroundColor: isSelected ? `${card.color}10` : undefined,
      }}
      onClick={onClick}
    >
      <Group justify="space-between" mb="xs">
        <IconComponent size={32} color={card.color} />
        <Badge color={card.color} variant="light">
          {card.category}
        </Badge>
      </Group>

      <Text fw={700} size="lg" mb="xs">
        {card.name}
      </Text>

      <Text size="sm" c="dimmed" mb="md">
        {card.description}
      </Text>

      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed">
          Parameters:
        </Text>
        {Object.entries(card.parameters).map(([key, value]) => (
          <Group key={key} justify="space-between">
            <Text size="xs" c="dimmed">
              {key}:
            </Text>
            <Text size="xs" fw={500}>
              {String(value)}
            </Text>
          </Group>
        ))}
      </Stack>
    </Card>
  );
}
