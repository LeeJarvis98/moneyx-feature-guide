'use client';

import { Card, Image, Badge, Title, Text, Group, ActionIcon, useMantineTheme } from '@mantine/core';
import { Clock, Users, Star, Heart, Share } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  courseType?: string;
  students: number;
  rating: number;
  image: string;
  articlePath: string;
  type: string;
}

interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
}

const getCourseTypeColor = (courseType: string | undefined) => {
  if (!courseType) return 'gray';
  
  const type = courseType.toLowerCase();
  if (type.includes('lesson')) return 'blue';
  if (type.includes('guide')) return 'green';
  if (type.includes('strategy')) return 'violet';
  return 'cyan';
};

export function CourseCard({ course, onClick }: CourseCardProps) {
  const theme = useMantineTheme();

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      style={{ height: '100%', cursor: 'pointer' }}
      onClick={() => onClick(course)}
    >
      <Card.Section mb="sm">
        <Image src={course.image} alt={course.title} height={180} />
      </Card.Section>

      {course.courseType && (
        <Badge color={getCourseTypeColor(course.courseType)} variant="light" mb="xs">
          {course.courseType}
        </Badge>
      )}

      <Title order={4} mb="xs" lineClamp={2}>
        {course.title}
      </Title>

      <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
        {course.description}
      </Text>

      <Card.Section withBorder inheritPadding py="sm" mt="auto">
        <Group justify="space-between">
          <Group gap="md">
            <Group gap={4}>
              <Clock size={14} />
              <Text size="xs" c="dimmed">
                {course.duration}
              </Text>
            </Group>
            <Group gap={4}>
              <Users size={14} />
              <Text size="xs" c="dimmed">
                {course.students}
              </Text>
            </Group>
            <Group gap={4}>
              <Star size={14} color={theme.colors.yellow[6]} fill={theme.colors.yellow[6]} />
              <Text size="xs" c="dimmed">
                {course.rating}
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
              <Heart size={18} color={theme.colors.red[6]} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Share size={18} color={theme.colors.blue[6]} />
            </ActionIcon>
          </Group>
        </Group>
      </Card.Section>
    </Card>
  );
}
