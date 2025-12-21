'use client';

import { useState } from 'react';
import { Container, Title, Text, AppShell, useMantineTheme, Tabs, Group, Stack } from '@mantine/core';
import { Compass, Calculator } from 'lucide-react';
import { FeatureGuideTab } from '@/components/tabs/FeatureGuideTab';
import { ProfitCalculatorTab } from '@/components/tabs/ProfitCalculatorTab';
import { SavedResultsAside, SavedResult } from '@/components/SavedResultsAside';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string | null>('feature-guide');
  const [simulationData, setSimulationData] = useState({
    initialLot: 0.01,
    nextLot: 0.02,
    dcaType: 'add' as 'add' | 'multiply',
    maxOrders: 30,
    dcaDistance: 300,
    currencyPair: 'XAUUSD',
  });
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SavedResult | null>(null);
  const [featureGuideAside, setFeatureGuideAside] = useState<React.ReactNode>(null);
  const theme = useMantineTheme();
  const t = useTranslations('common');
  const tTabs = useTranslations('tabs');

  const handleSaveResult = (result: SavedResult) => {
    setSavedResults(prev => [result, ...prev]);
  };

  const handleSelectResult = (result: SavedResult) => {
    setSelectedResult(result);
  };

  const handleDeleteResult = (id: string) => {
    setSavedResults(prev => prev.filter(r => r.id !== id));
    if (selectedResult?.id === id) {
      setSelectedResult(null);
    }
  };

  return (
    <AppShell 
      transitionDuration={500}
      transitionTimingFunction="ease" 
      header={{ height: 100 }} 
      footer={{ height: 60 }} 
      aside={{ 
        width: 400, 
        breakpoint: 'md', 
        collapsed: { mobile: true, desktop: false }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="100%" h="100%">
          <Stack gap="xs" justify="center" h="100%">
            <Group justify="space-between" align="center">
              <div>
                <Title order={1} size="h2" c={theme.colors.accent[6]}>
                  {t('appName')}
                </Title>
                <Text size="sm" c="dimmed">
                  {t('appDescription')}
                </Text>
              </div>
              <LanguageSwitcher />
            </Group>
            <Tabs value={activeTab} onChange={setActiveTab} radius="md">
              <Tabs.List>
                <Tabs.Tab
                  value="feature-guide"
                >
                  {tTabs('featureGuide')}
                </Tabs.Tab>
                <Tabs.Tab
                  value="profit-calculator"
                >
                  {tTabs('profitCalculator')}
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Stack>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.Panel value="feature-guide">
            <FeatureGuideTab onAsideContentChange={setFeatureGuideAside} />
          </Tabs.Panel>

          <Tabs.Panel value="profit-calculator">
            <ProfitCalculatorTab 
              onSimulationUpdate={setSimulationData}
              onSaveResult={handleSaveResult}
              selectedResult={selectedResult}
            />
          </Tabs.Panel>
        </Tabs>
      </AppShell.Main>

      <AppShell.Aside p="md">
        {activeTab === 'profit-calculator' ? (
          <SavedResultsAside
            savedResults={savedResults}
            onSelectResult={handleSelectResult}
            onDeleteResult={handleDeleteResult}
            selectedResultId={selectedResult?.id}
          />
        ) : activeTab === 'feature-guide' ? (
          featureGuideAside
        ) : null}
      </AppShell.Aside>

      <AppShell.Footer>
        <Container size="100%" h="100%">
          <Group justify="space-between" align="center" h="100%">
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} Tradi. {t('allRightsReserved')}
            </Text>
            <Group gap="md">
              <Text size="sm" c="dimmed" component="a" href="#" style={{ textDecoration: 'none' }}>
                {t('about')}
              </Text>
              <Text size="sm" c="dimmed" component="a" href="#" style={{ textDecoration: 'none' }}>
                {t('privacy')}
              </Text>
              <Text size="sm" c="dimmed" component="a" href="#" style={{ textDecoration: 'none' }}>
                {t('terms')}
              </Text>
            </Group>
          </Group>
        </Container>
      </AppShell.Footer>
    </AppShell>
  );
}
