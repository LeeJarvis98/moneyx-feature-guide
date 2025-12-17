'use client';

import { Card as CardType } from '@/types';
import { Paper, Text, Group, Stack, Badge, ActionIcon, useMantineTheme } from '@mantine/core';
import { X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface CoreCardProps {
  card: CardType;
  onRemove: () => void;
}

export function CoreCard({ card, onRemove }: CoreCardProps) {
  const IconComponent = (Icons[card.icon as keyof typeof Icons] as LucideIcon) || Icons.HelpCircle;
  const theme = useMantineTheme();

  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      style={{
        backgroundColor: card.color
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <IconComponent size={24} color={theme.black} />
          <Text fw={600} size="sm" c="black">
            {card.name}
          </Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onRemove}
          aria-label="Remove card"
          style={{ color: theme.black }}
        >
          <X size={16} />
        </ActionIcon>
      </Group>

      <Badge color="light" variant="filled" size="xs" style={{ backgroundColor: theme.white, color: theme.black }}>
        {card.category}
      </Badge>
    </Paper>
  );
}
