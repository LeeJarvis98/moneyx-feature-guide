'use client';

import { Container, Title, Text, Paper, Stack, useMantineTheme } from '@mantine/core';
import { Calculator } from 'lucide-react';

export function ProfitCalculatorTab() {
  const theme = useMantineTheme();

  return (
    <Container size="xl">
      <Paper withBorder p="xl" radius="md">
        <Stack align="center" gap="xl" py="xl">
          <Calculator size={64} color={theme.colors.accent[6]} />
          <Title order={2} size="h2" c={theme.white}>
            Profit Calculator
          </Title>
          <Text size="lg" c="dimmed" ta="center" maw={600}>
            Coming Soon! Calculate your potential profits and ROI based on selected MoneyX features.
          </Text>
          <Text size="sm" c="dimmed" ta="center" maw={600}>
            This tool will help you analyze the financial impact of different feature combinations
            and make data-driven decisions about your financial strategy.
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
