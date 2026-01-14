'use client';

import { Modal, Text, Badge, Group, Stack, Switch, Title } from '@mantine/core';
import { Card as CardType } from '@/types';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface CardDetailModalProps {
  card: CardType | null;
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function CardDetailModal({ card, isOpen, onClose, isEnabled, onToggle }: CardDetailModalProps) {
  if (!card) return null;

  const IconComponent = (Icons[card.icon as keyof typeof Icons] as LucideIcon) || Icons.HelpCircle;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="md">
          <IconComponent size={32} color={card.color} />
          <Title order={3}>{card.name}</Title>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Badge color={card.color} variant="light" size="lg">
            {card.category}
          </Badge>
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {isEnabled ? 'Đã bật' : 'Đã tắt'}
            </Text>
            <Switch
              checked={isEnabled}
              onChange={(event) => onToggle(event.currentTarget.checked)}
              color={card.color}
              size="md"
            />
          </Group>
        </Group>

        <div>
          <Text size="sm" fw={600} mb="xs" c="dimmed">
            Mô tả
          </Text>
          <Text size="md">{card.description}</Text>
        </div>

        <div>
          <Text size="sm" fw={600} mb="md" c="dimmed">
            Tham số
          </Text>
          <Stack gap="sm">
            {Object.entries(card.parameters).map(([key, value]) => (
              <Group key={key} justify="space-between" p="sm" style={{ backgroundColor: '#000000', borderRadius: '8px' }}>
                <Text size="sm" fw={500}>
                  {key}:
                </Text>
                <Text size="sm" c="dimmed">
                  {String(value)}
                </Text>
              </Group>
            ))}
          </Stack>
        </div>
      </Stack>
    </Modal>
  );
}
