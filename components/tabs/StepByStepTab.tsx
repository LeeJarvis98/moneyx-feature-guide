'use client';

import { Title, Text, Stack, Box, AspectRatio } from '@mantine/core';
import { useTranslations } from 'next-intl';

export function StepByStepTab() {
  const t = useTranslations('tabs');

  return (
    <Box>
      <Stack gap="xl" mb="xl" px="md">
        <div>
          <Title order={2} mb="xs">
            {t('stepByStep')}
          </Title>
          <Text c="dimmed">
            Follow these steps to master the MoneyX Bot and maximize your trading potential
          </Text>
        </div>
      </Stack>

      <Box px="md">
        <AspectRatio ratio={16 / 9}>
          <iframe
            src="https://drive.google.com/file/d/1RcLshg0XdRidk5DBoQc9xqZHHWc0Vxsj/preview"
            title="Step by Step Guide"
            style={{ border: 'none', borderRadius: '8px' }}
            allow="autoplay"
          />
        </AspectRatio>
      </Box>
    </Box>
  );
}