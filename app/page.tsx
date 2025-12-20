'use client';

import { useState } from 'react';
import { Container, Title, Text, AppShell, useMantineTheme, Tabs, Group, Stack } from '@mantine/core';
import { Compass, Calculator } from 'lucide-react';
import { FeatureGuideTab } from '@/components/tabs/FeatureGuideTab';
import { ProfitCalculatorTab } from '@/components/tabs/ProfitCalculatorTab';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string | null>('feature-guide');
  const theme = useMantineTheme();

  return (
    <AppShell transitionDuration={500}
      transitionTimingFunction="ease" header={{ height: 100 }} footer={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Stack gap="xs" justify="center" h="100%">
            <Group justify="space-between" align="center">
              <div>
                <Title order={1} size="h2" c={theme.colors.accent[6]}>
                  MoneyX Feature Guide
                </Title>
                <Text size="sm" c="dimmed">
                  Discover powerful financial feature combinations
                </Text>
              </div>
            </Group>
            <Tabs value={activeTab} onChange={setActiveTab} radius="md">
              <Tabs.List>
                <Tabs.Tab
                  value="feature-guide"
                >
                  Feature Guide
                </Tabs.Tab>
                <Tabs.Tab
                  value="profit-calculator"
                >
                  Profit Calculator
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Stack>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.Panel value="feature-guide">
            <FeatureGuideTab />
          </Tabs.Panel>

          <Tabs.Panel value="profit-calculator">
            <ProfitCalculatorTab />
          </Tabs.Panel>
        </Tabs>
      </AppShell.Main>

      <AppShell.Footer>
        <Container size="xl" h="100%">
          <Group justify="space-between" align="center" h="100%">
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} MoneyX. All rights reserved.
            </Text>
            <Group gap="md">
              <Text size="sm" c="dimmed" component="a" href="#" style={{ textDecoration: 'none' }}>
                About
              </Text>
              <Text size="sm" c="dimmed" component="a" href="#" style={{ textDecoration: 'none' }}>
                Privacy
              </Text>
              <Text size="sm" c="dimmed" component="a" href="#" style={{ textDecoration: 'none' }}>
                Terms
              </Text>
            </Group>
          </Group>
        </Container>
      </AppShell.Footer>
    </AppShell>
  );
}
