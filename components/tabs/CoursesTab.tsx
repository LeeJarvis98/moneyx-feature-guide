'use client';

import { Container, Title, Text, Stack, Paper, Grid, Badge, Group, Button, useMantineTheme } from '@mantine/core';
import { BookOpen, Clock, Users, Star, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  students: number;
  rating: number;
}

const courses: Course[] = [
  {
    id: '1',
    title: 'DCA Trading Fundamentals',
    description: 'Master the basics of Dollar Cost Averaging and automated trading strategies',
    duration: '4 hours',
    level: 'beginner',
    students: 1250,
    rating: 4.8,
  },
  {
    id: '2',
    title: 'Advanced Bot Configuration',
    description: 'Learn to optimize your bot settings for maximum profitability',
    duration: '6 hours',
    level: 'intermediate',
    students: 890,
    rating: 4.9,
  },
  {
    id: '3',
    title: 'Risk Management Mastery',
    description: 'Protect your capital with proven risk management techniques',
    duration: '5 hours',
    level: 'intermediate',
    students: 1100,
    rating: 4.7,
  },
  {
    id: '4',
    title: 'Market Analysis for Bots',
    description: 'Understand market conditions and when to deploy your trading bot',
    duration: '8 hours',
    level: 'advanced',
    students: 650,
    rating: 4.9,
  },
  {
    id: '5',
    title: 'Portfolio Optimization',
    description: 'Diversify and optimize your trading portfolio for consistent returns',
    duration: '7 hours',
    level: 'advanced',
    students: 580,
    rating: 4.8,
  },
  {
    id: '6',
    title: 'Trading Psychology',
    description: 'Develop the mindset of successful algorithmic traders',
    duration: '3 hours',
    level: 'beginner',
    students: 920,
    rating: 4.6,
  },
];

const getLevelColor = (level: Course['level']) => {
  switch (level) {
    case 'beginner':
      return 'green';
    case 'intermediate':
      return 'blue';
    case 'advanced':
      return 'violet';
  }
};

export function CoursesTab() {
  const theme = useMantineTheme();
  const t = useTranslations('tabs');

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={2} mb="xs">
            {t('courses')}
          </Title>
          <Text c="dimmed">
            Comprehensive courses to help you become a profitable trader with MoneyX Bot
          </Text>
        </div>

        <Grid gutter="lg">
          {courses.map((course) => (
            <Grid.Col key={course.id} span={{ base: 12, sm: 6, lg: 4 }}>
              <Paper p="lg" h="100%" withBorder style={{ display: 'flex', flexDirection: 'column' }}>
                <Stack gap="md" style={{ flex: 1 }}>
                  <Group justify="space-between" align="flex-start">
                    <BookOpen size={32} color={theme.colors.blue[6]} />
                    <Badge color={getLevelColor(course.level)} variant="light">
                      {course.level}
                    </Badge>
                  </Group>

                  <div>
                    <Title order={4} mb="xs">
                      {course.title}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {course.description}
                    </Text>
                  </div>

                  <Stack gap="xs" mt="auto">
                    <Group gap="lg">
                      <Group gap="xs">
                        <Clock size={16} />
                        <Text size="xs">{course.duration}</Text>
                      </Group>
                      <Group gap="xs">
                        <Users size={16} />
                        <Text size="xs">{course.students}</Text>
                      </Group>
                      <Group gap="xs">
                        <Star size={16} color={theme.colors.yellow[6]} />
                        <Text size="xs">{course.rating}</Text>
                      </Group>
                    </Group>

                    <Button fullWidth rightSection={<ArrowRight size={16} />} variant="light">
                      Start Learning
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}