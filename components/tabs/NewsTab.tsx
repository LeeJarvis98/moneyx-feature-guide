'use client';

import { useState, useMemo } from 'react';
import { Container, Text, Stack, Grid, Group, Button, Center, TextInput, ActionIcon } from '@mantine/core';
import { Newspaper, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NewsCard } from '@/components/NewsCard';
import { NewsCardDetailModal } from '@/components/NewsCardDetailModal';
import type { NewsArticle } from '@/types';

// Mock news data
const mockNewsArticles: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Breaking: Major Market Shift in 2026',
    description: 'Financial experts report unprecedented changes in global markets as new regulations take effect.',
    category: 'Breaking',
    publishDate: 'Jan 9, 2026',
    readTime: '5 min read',
    views: 12453,
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
    articlePath: '/news/news-1.html',
  },
  {
    id: 'news-2',
    title: 'Tech Giants Report Record Earnings',
    description: 'Leading technology companies exceed market expectations in Q4 2025 earnings reports.',
    category: 'Technology',
    publishDate: 'Jan 8, 2026',
    readTime: '4 min read',
    views: 9876,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    articlePath: '/news/news-2.html',
  },
  {
    id: 'news-3',
    title: 'Real Estate Market Shows Signs of Recovery',
    description: 'Housing market indicators suggest stabilization after months of uncertainty.',
    category: 'Market',
    publishDate: 'Jan 7, 2026',
    readTime: '6 min read',
    views: 8234,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop',
    articlePath: '/news/news-3.html',
  },
  {
    id: 'news-4',
    title: 'Central Banks Signal Policy Shifts',
    description: 'Major central banks worldwide coordinate efforts to address inflation concerns while supporting economic growth.',
    category: 'Economy',
    publishDate: 'Jan 6, 2026',
    readTime: '5 min read',
    views: 15678,
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop',
    articlePath: '/news/news-4.html',
  },
  {
    id: 'news-5',
    title: 'Sustainable Investing Reaches New Heights',
    description: 'ESG investments surpass $10 trillion globally as investors prioritize sustainability.',
    category: 'ESG',
    publishDate: 'Jan 5, 2026',
    readTime: '7 min read',
    views: 11234,
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=400&fit=crop',
    articlePath: '/news/news-5.html',
  },
  {
    id: 'news-6',
    title: 'Fintech Revolution Transforms Banking',
    description: 'Digital banking platforms disrupt traditional financial services with innovative solutions.',
    category: 'Fintech',
    publishDate: 'Jan 4, 2026',
    readTime: '6 min read',
    views: 13456,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop',
    articlePath: '/news/news-6.html',
  },
];

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

export function NewsTab() {
  const t = useTranslations('tabs');
  const [opened, setOpened] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [articleContent, setArticleContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NewsArticle['category'] | null>(null);

  const handleArticleClick = async (article: NewsArticle) => {
    setOpened(true);

    try {
      const response = await fetch(article.articlePath);
      const html = await response.text();
      setArticleContent(html);
      setSelectedArticle(article);
    } catch (error) {
      console.error('Failed to load article:', error);
      setArticleContent('<p>Failed to load article content.</p>');
      setSelectedArticle(article);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(mockNewsArticles.map(article => article.category));
    return Array.from(uniqueCategories);
  }, []);

  // Filter articles based on search query and selected category
  const filteredArticles = useMemo(() => {
    return mockNewsArticles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Text c="white">
            {t('newsDescription')}
          </Text>
        </div>

        <Stack gap="md">
          <TextInput
            placeholder={t('searchNewsPlaceholder')}
            leftSection={<Search size={16} />}
            rightSection={
              searchQuery && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </ActionIcon>
              )
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="md"
          />

          <Group gap="xs">
            <Button
              variant={selectedCategory === null ? 'filled' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              {t('all')}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'filled' : 'outline'}
                color={getCategoryColor(category)}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </Group>
        </Stack>

        {filteredArticles.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Newspaper size={48} />
              <Text c="dimmed" size="lg">
                {t('noNewsFound')}
              </Text>
              <Text c="dimmed" size="sm">
                {t('adjustFilters')}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Grid gutter="lg">
            {filteredArticles.map((article) => (
              <Grid.Col key={article.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <NewsCard article={article} onClick={handleArticleClick} />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      <NewsCardDetailModal
        opened={opened}
        onClose={() => setOpened(false)}
        article={selectedArticle}
        articleContent={articleContent}
      />
    </Container>
  );
}