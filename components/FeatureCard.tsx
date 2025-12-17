'use client';

import { Card as CardType } from '@/types';
import { Card, Text, Badge, Group, Stack, Switch } from '@mantine/core';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  card: CardType;
  onClick: () => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function FeatureCard({ card, onClick, isEnabled, onToggle }: FeatureCardProps) {
  const IconComponent = (Icons[card.icon as keyof typeof Icons] as LucideIcon) || Icons.HelpCircle;

  const handleSwitchClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onToggle(event.currentTarget.checked);
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        cursor: 'pointer',
        borderColor: isEnabled ? card.color : undefined,
        borderWidth: isEnabled ? 2 : 1,
        transition: 'all 0.2s ease',
        backgroundColor: isEnabled ? `${card.color}10` : undefined,
      }}
      onClick={onClick}
    >
      <Group justify="space-between" mb="xs">
        <IconComponent size={32} color={card.color} />
        <Group gap="xs">
          <Badge color={card.color} variant="light">
            {card.category}
          </Badge>
          <div onClick={handleSwitchClick}>
            <Switch
              checked={isEnabled}
              onChange={handleSwitchChange}
              color={card.color}
              size="sm"
            />
          </div>
        </Group>
      </Group>

      <Text fw={700} size="lg" mb="xs">
        {card.name}
      </Text>

      <Text size="sm" c="dimmed">
        {card.description}
      </Text>
    </Card>
  );
}
