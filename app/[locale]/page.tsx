'use client';

import { useState } from 'react';
import { Container, Title, Text, AppShell, useMantineTheme, Tabs, Group, Stack, Button } from '@mantine/core';
import { Compass, Calculator, BookOpen, GraduationCap } from 'lucide-react';
import { FeatureGuideTab } from '@/components/tabs/FeatureGuideTab';
import { ProfitCalculatorTab } from '@/components/tabs/ProfitCalculatorTab';
import { StepByStepTab } from '@/components/tabs/StepByStepTab';
import { CoursesTab } from '@/components/tabs/CoursesTab';
import { SavedResultsAside, SavedResult } from '@/components/SavedResultsAside';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

type NavigationSection = 'features' | 'learn';

export default function HomePage() {
  const [navigationSection, setNavigationSection] = useState<NavigationSection>('features');
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
  const tNav = useTranslations('navigation');

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

  // Handle navigation section change
  const handleNavigationChange = (value: string) => {
    setNavigationSection(value as NavigationSection);
    // Set default tab for each section
    if (value === 'features') {
      setActiveTab('feature-guide');
    } else if (value === 'learn') {
      setActiveTab('step-by-step');
    }
  };

  return (
    <AppShell
      transitionDuration={500}
      transitionTimingFunction="ease"
      header={{ height: 120 }}
      footer={{ height: 60 }}
      aside={{
        width: 400,
        breakpoint: 'md',
        collapsed: { mobile: true, desktop: navigationSection === 'learn' }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="100%" h="100%">
          <Stack gap="md" justify="end" h="100%">
            <Group justify="space-between" align="center">
              <div>
                <Title order={1} size="h2" c={theme.colors.accent[6]}>
                  {t('appName')}
                </Title>
                <Text size="sm" c="dimmed">
                  {t('appDescription')}
                </Text>
              </div>
              <Group gap="md">
                <Button
                  variant={navigationSection === 'features' ? 'filled' : 'subtle'}
                  leftSection={<Compass size={18} />}
                  onClick={() => handleNavigationChange('features')}
                >
                  {tNav('features')}
                </Button>
                <Button
                  variant={navigationSection === 'learn' ? 'filled' : 'subtle'}
                  leftSection={<GraduationCap size={18} />}
                  onClick={() => handleNavigationChange('learn')}
                >
                  {tNav('learn')}
                </Button>
                <LanguageSwitcher />
              </Group>
            </Group>
            <Tabs value={activeTab} onChange={setActiveTab} radius="md">
              <Tabs.List>
                {navigationSection === 'features' && (
                  <>
                    <Tabs.Tab value="feature-guide">
                      {tTabs('featureGuide')}
                    </Tabs.Tab>
                    <Tabs.Tab value="profit-calculator">
                      {tTabs('profitCalculator')}
                    </Tabs.Tab>
                  </>
                )}
                {navigationSection === 'learn' && (
                  <>
                    <Tabs.Tab value="step-by-step">
                      {tTabs('stepByStep')}
                    </Tabs.Tab>
                    <Tabs.Tab value="courses">
                      {tTabs('courses')}
                    </Tabs.Tab>
                  </>
                )}
              </Tabs.List>
            </Tabs>
          </Stack>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Tabs value={activeTab} onChange={setActiveTab}>
          {/* Features Section Tabs */}
          {navigationSection === 'features' && (
            <>
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
            </>
          )}

          {/* Learn Section Tabs */}
          {navigationSection === 'learn' && (
            <>
              <Tabs.Panel value="step-by-step">
                <StepByStepTab />
              </Tabs.Panel>

              <Tabs.Panel value="courses">
                <CoursesTab />
              </Tabs.Panel>
            </>
          )}
        </Tabs>
      </AppShell.Main>

      <AppShell.Aside p="md">
        {navigationSection === 'features' && (
          <>
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
          </>
        )}
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
    </AppShell >
  );
}
