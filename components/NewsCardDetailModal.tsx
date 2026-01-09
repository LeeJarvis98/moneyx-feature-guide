'use client';

import { Modal, Stack, Group, Badge, Text } from '@mantine/core';
import { Clock, Eye, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { NewsArticle } from '@/types';

interface NewsCardDetailModalProps {
  opened: boolean;
  onClose: () => void;
  article: NewsArticle | null;
  articleContent: string;
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

export function NewsCardDetailModal({ opened, onClose, article, articleContent }: NewsCardDetailModalProps) {
  const t = useTranslations('tabs');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      padding="lg"
      title={article?.title}
    >
      <Stack gap="xs">
        {article && (
          <>
            <Group gap="md" mb="md">
              <Badge color={getCategoryColor(article.category)} variant="light">
                {article.category}
              </Badge>
              <Group gap={4}>
                <Calendar size={16} />
                <Text size="sm">{article.publishDate}</Text>
              </Group>
              <Group gap={4}>
                <Clock size={16} />
                <Text size="sm">{article.readTime}</Text>
              </Group>
              <Group gap={4}>
                <Eye size={16} />
                <Text size="sm">{article.views.toLocaleString()} {t('views')}</Text>
              </Group>
            </Group>
            <div 
              dangerouslySetInnerHTML={{ __html: articleContent }}
              className="news-article-content"
            />
          </>
        )}
      </Stack>
    </Modal>
  );
}
