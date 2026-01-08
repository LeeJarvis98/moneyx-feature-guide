'use client';

import { Modal, Stack, Image, Group, Badge, Text, useMantineTheme } from '@mantine/core';
import { Clock, Users, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

interface CourseCardDetailModalProps {
  opened: boolean;
  onClose: () => void;
  course: Course | null;
  articleContent: string;
}

const getCourseTypeColor = (courseType: string | undefined) => {
  if (!courseType) return 'gray';
  
  const type = courseType.toLowerCase();
  if (type.includes('lesson')) return 'blue';
  if (type.includes('guide')) return 'green';
  if (type.includes('strategy')) return 'violet';
  return 'cyan';
};

export function CourseCardDetailModal({ opened, onClose, course, articleContent }: CourseCardDetailModalProps) {
  const theme = useMantineTheme();
  const t = useTranslations('tabs');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      padding="lg"
    >
      <Stack gap="xs">
        {course && (
          <>
            <Group gap="md">
              {course.courseType && (
                <Badge color={getCourseTypeColor(course.courseType)} variant="light">
                  {course.courseType}
                </Badge>
              )}
              <Group gap={4}>
                <Clock size={16} />
                <Text size="sm">{course.duration}</Text>
              </Group>
              <Group gap={4}>
                <Users size={16} />
                <Text size="sm">{course.students} {t('students')}</Text>
              </Group>
              <Group gap={4}>
                <Star size={16} color={theme.colors.yellow[6]} fill={theme.colors.yellow[6]} />
                <Text size="sm">{course.rating}</Text>
              </Group>
            </Group>
            <div dangerouslySetInnerHTML={{ __html: articleContent }} />
          </>
        )}
      </Stack>
    </Modal>
  );
}
