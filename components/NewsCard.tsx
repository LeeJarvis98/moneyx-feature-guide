'use client';

import { Card, Image, Badge, Title, Text, Group, ActionIcon, useMantineTheme } from '@mantine/core';
import { Clock, Eye, Calendar, Heart, Share2 } from 'lucide-react';
import type { NewsArticle } from '@/types';

interface NewsCardProps {
  article: NewsArticle;
  onClick: (article: NewsArticle) => void;
}

const getCategoryColor = (category: NewsArticle['category']) => {
  const colorMap: Record<NewsArticle['category'], string> = {
    Breaking: 'red',
    Market: 'blue',
    Technology: 'violet',
    Economy: 'green',
    ESG: 'teal',
    Fintech: 'cyan',
  };
  return colorMap[category] || 'gray';
};

export function NewsCard({ article, onClick }: NewsCardProps) {
  const theme = useMantineTheme();

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      style={{ height: '100%', cursor: 'pointer', transition: 'transform 0.2s' }}
      onClick={() => onClick(article)}
      className="hover:scale-[1.02]"
    >
      <Card.Section mb="sm">
        <Image src={article.image} alt={article.title} height={180} />
      </Card.Section>

      <Badge color={getCategoryColor(article.category)} variant="light" mb="xs">
        {article.category}
      </Badge>

      <Title order={4} mb="xs" lineClamp={2}>
        {article.title}
      </Title>

      <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
        {article.description}
      </Text>

      <Card.Section withBorder inheritPadding py="sm" mt="auto">
        <Group justify="space-between">
          <Group gap="md">
            <Group gap={4}>
              <Calendar size={14} />
              <Text size="xs" c="dimmed">
                {article.publishDate}
              </Text>
            </Group>
            <Group gap={4}>
              <Clock size={14} />
              <Text size="xs" c="dimmed">
                {article.readTime}
              </Text>
            </Group>
            <Group gap={4}>
              <Eye size={14} />
              <Text size="xs" c="dimmed">
                {article.views.toLocaleString()}
              </Text>
            </Group>
          </Group>
          <Group gap={0}>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Heart size={18} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Share2 size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Card.Section>
    </Card>
  );
}
