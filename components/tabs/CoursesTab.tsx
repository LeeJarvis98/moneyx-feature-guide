'use client';

import { useState, useEffect, useMemo } from 'react';
import { Container, Title, Text, Stack, Grid, Group, Button, Loader, Center, TextInput, ActionIcon } from '@mantine/core';
import { BookOpen, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CourseCard } from '@/components/CourseCard';
import { CourseCardDetailModal } from '@/components/CourseCardDetailModal';

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

const getCourseTypeColor = (courseType: string | undefined) => {
  if (!courseType) return 'gray';
  
  const type = courseType.toLowerCase();
  if (type.includes('lesson')) return 'blue';
  if (type.includes('guide')) return 'green';
  if (type.includes('strategy')) return 'violet';
  return 'cyan';
};

const extractCourseType = (htmlContent: string): string => {
  const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    const h1Text = h1Match[1].replace(/<[^>]*>/g, '').trim();
    // Extract only the first word consisting of letters (e.g., "Lesson" from "Lesson 2.1: Title")
    const typeMatch = h1Text.match(/^([A-Za-z]+)/);
    if (typeMatch && typeMatch[1]) {
      return typeMatch[1];
    }
  }
  return 'Course';
};

export function CoursesTab() {
  const t = useTranslations('tabs');
  const [opened, setOpened] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [articleContent, setArticleContent] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        
        // Extract courseType for each course from its article
        const coursesWithTypes = await Promise.all(
          data.map(async (course: Course) => {
            try {
              const articleResponse = await fetch(course.articlePath);
              const html = await articleResponse.text();
              const extractedType = extractCourseType(html);
              return { ...course, courseType: extractedType };
            } catch (error) {
              console.error(`Failed to extract type for course ${course.id}:`, error);
              return { ...course, courseType: 'Course' };
            }
          })
        );
        
        setCourses(coursesWithTypes);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = async (course: Course) => {
    setOpened(true);

    try {
      const response = await fetch(course.articlePath);
      const html = await response.text();
      setArticleContent(html);
      
      // Extract course type from HTML h1 title
      const extractedType = extractCourseType(html);
      setSelectedCourse({
        ...course,
        courseType: extractedType
      });
    } catch (error) {
      console.error('Failed to load article:', error);
      setArticleContent('<p>Failed to load course content.</p>');
      setSelectedCourse(course);
    }
  };

  // Get unique course types
  const courseTypes = useMemo(() => {
    const types = new Set(courses.map(course => course.courseType).filter(Boolean));
    return Array.from(types) as string[];
  }, [courses]);

  // Filter courses based on search query and selected type
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !selectedType || course.courseType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [courses, searchQuery, selectedType]);

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Text c="white">
            {t('coursesDescription')}
          </Text>
        </div>

        <Stack gap="md">
          <TextInput
            placeholder={t('searchPlaceholder')}
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
              variant={selectedType === null ? 'filled' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              {t('all')}
            </Button>
            {courseTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'filled' : 'outline'}
                color={getCourseTypeColor(type)}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                {type}
              </Button>
            ))}
          </Group>
        </Stack>

        {loading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : filteredCourses.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <BookOpen size={48} />
              <Text c="dimmed" size="lg">
                {t('noCoursesFound')}
              </Text>
              <Text c="dimmed" size="sm">
                {t('adjustFilters')}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Grid gutter="lg">
            {filteredCourses.map((course) => (
              <Grid.Col key={course.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <CourseCard course={course} onClick={handleCourseClick} />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      <CourseCardDetailModal
        opened={opened}
        onClose={() => setOpened(false)}
        course={selectedCourse}
        articleContent={articleContent}
      />
    </Container>
  );
}