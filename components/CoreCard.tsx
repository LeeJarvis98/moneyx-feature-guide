'use client';

import { Card as CardType } from '@/types';
import { Paper, Text, Group, Stack, Badge, ActionIcon } from '@mantine/core';
import { X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface CoreCardProps {
  card: CardType;
  onRemove: () => void;
}

export function CoreCard({ card, onRemove }: CoreCardProps) {
  const IconComponent = (Icons[card.icon as keyof typeof Icons] as LucideIcon) || Icons.HelpCircle;

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{
        borderColor: card.color,
        borderWidth: 2,
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconComponent size={24} color={card.color} />
          <Text fw={600} size="sm">
            {card.name}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={onRemove}
          aria-label="Remove card"
        >
          <X size={16} />
        </ActionIcon>
      </Group>

      <Badge color={card.color} variant="light" size="xs">
        {card.category}
      </Badge>
    </Paper>
  );
}
