'use client';

import { useState } from 'react';
import { Container, Title, Text, AppShell, useMantineTheme, Tabs, Group, Stack, Button, NavLink, ScrollArea, Burger, ActionIcon, Affix, Transition } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Compass, Calculator, GraduationCap, TrendingUp, FileText, PanelRight, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { FeatureGuideTab } from '@/components/tabs/FeatureGuideTab';
import { ProfitCalculatorTab } from '@/components/tabs/ProfitCalculatorTab';
import { StepByStepTab } from '@/components/tabs/StepByStepTab';
import { SavedResultsAside, SavedResult } from '@/components/SavedResultsAside';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { HeroSection } from '@/components/HeroSection';
import { useTranslations } from 'next-intl';

type NavigationSection = 'features' | 'learn';

export default function HomePage() {
  const [showHero, setShowHero] = useState(true);
  const [mobileNavOpened, { toggle: toggleMobileNav, close: closeMobileNav }] = useDisclosure(false);
  const [mobileAsideOpened, { toggle: toggleMobileAside, close: closeMobileAside }] = useDisclosure(false);
  const [navigationSection, setNavigationSection] = useState<NavigationSection>('learn');
  const [activeTab, setActiveTab] = useState<string | null>('step-by-step');
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
  const [selectedArticle, setSelectedArticle] = useState<string>('lesson-1');
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
    // Close mobile menus when switching sections
    closeMobileNav();
    closeMobileAside();
  };

  // Close mobile menus when changing tabs
  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    closeMobileNav();
    closeMobileAside();
  };

  // Determine if navbar should be shown
  const shouldShowNavbar = navigationSection === 'learn' && activeTab === 'step-by-step';

  // Determine if aside should be shown
  const shouldShowAside = (navigationSection === 'features' && activeTab === 'feature-guide') || (navigationSection === 'learn' && activeTab === 'profit-calculator');

  // Handle hero "Get Started" action
  const handleGetStarted = () => {
    setShowHero(false);
  };

  // Show hero on first visit
  if (showHero) {
    return <HeroSection onGetStarted={handleGetStarted} />;
  }

  return (
    <AppShell
      transitionDuration={500}
      transitionTimingFunction="ease"
      header={{ height: 100 }}
      footer={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileNavOpened, desktop: !shouldShowNavbar }
      }}
      aside={{
        width: 400,
        breakpoint: 'md',
        collapsed: { mobile: !mobileAsideOpened, desktop: !shouldShowAside }
      }}
      padding="md"
    >
      <AppShell.Header
        style={{
          backgroundColor: 'color-mix(in srgb, var(--mantine-color-body), transparent 15%)',
          backdropFilter: 'blur(5px)',
        }}
      >
        <Container size="100%" h="100%">
          <Stack gap="md" justify="end" h="100%">
            <Group justify="space-between" align="center">
              <Group>
                {/* Burger menu for mobile - shows when navbar should be visible */}
                {shouldShowNavbar && (
                  <Burger
                    opened={mobileNavOpened}
                    onClick={toggleMobileNav}
                    hiddenFrom="sm"
                    size="sm"
                    aria-label="Toggle navigation menu"
                  />
                )}
                <Group gap="md">
                  <Image
                    src="/vnclc-logo.png"
                    alt="VNCLC Logo"
                    width={90.53}
                    height={20}
                    priority
                  />
                  <div>
                    <Title order={1} size="h2" c={theme.colors.accent[6]}>
                      {t('appName')}
                    </Title>
                  </div>
                </Group>
              </Group>
              <Group gap="md">
                <Button
                  variant={navigationSection === 'features' ? 'filled' : 'subtle'}
                  leftSection={<Compass size={18} />}
                  onClick={() => handleNavigationChange('features')}
                  visibleFrom="sm"
                >
                  {tNav('features')}
                </Button>
                <Button
                  variant={navigationSection === 'learn' ? 'filled' : 'subtle'}
                  leftSection={<GraduationCap size={18} />}
                  onClick={() => handleNavigationChange('learn')}
                  visibleFrom="sm"
                >
                  {tNav('learn')}
                </Button>
                {/* <LanguageSwitcher /> */}
              </Group>
            </Group>
            <Tabs value={activeTab} onChange={handleTabChange} radius="md">
              <Tabs.List>
                {navigationSection === 'features' && (
                  <>
                    <Tabs.Tab
                      value="feature-guide"
                      c={activeTab === 'feature-guide' ? theme.white : undefined}
                      fw={activeTab === 'feature-guide' ? 700 : undefined}
                    >
                      {tTabs('featureGuide')}
                    </Tabs.Tab>
                  </>
                )}
                {navigationSection === 'learn' && (
                  <>
                    <Tabs.Tab
                      value="step-by-step"
                      c={activeTab === 'step-by-step' ? theme.white : undefined}
                      fw={activeTab === 'step-by-step' ? 700 : undefined}
                    >
                      {tTabs('stepByStep')}
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="profit-calculator"
                      c={activeTab === 'profit-calculator' ? theme.white : undefined}
                      fw={activeTab === 'profit-calculator' ? 700 : undefined}
                    >
                      {tTabs('profitCalculator')}
                    </Tabs.Tab>
                  </>
                )}
              </Tabs.List>
            </Tabs>
            {/* Mobile navigation buttons */}
            <Group gap="xs" hiddenFrom="sm" justify="center">
              <Button
                variant={navigationSection === 'features' ? 'filled' : 'subtle'}
                leftSection={<Compass size={16} />}
                onClick={() => handleNavigationChange('features')}
                size="xs"
              >
                {tNav('features')}
              </Button>
              <Button
                variant={navigationSection === 'learn' ? 'filled' : 'subtle'}
                leftSection={<GraduationCap size={16} />}
                onClick={() => handleNavigationChange('learn')}
                size="xs"
              >
                {tNav('learn')}
              </Button>
            </Group>
          </Stack>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navigationSection === 'learn' && activeTab === 'step-by-step' && (
          <ScrollArea h="100%" type="auto" offsetScrollbars>
            <Stack gap="xs">
              <Text size="xs" fw={700} c="blue" tt="uppercase" mb="xs">
                Lessons
              </Text>

              <NavLink
                label="Lesson 1: Thông tin và ý nghĩa của Bot"
                description="Tìm hiểu các khái niệm và định nghĩa cơ bản"
                leftSection={<BookOpen size={16} color="#307fffff" />}
                active={selectedArticle === 'lesson-1'}
                fw={selectedArticle === 'lesson-1' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('lesson-1');
                  closeMobileNav();
                }}
                color="blue"
              />

              <NavLink
                label="Lesson 2: Bảng thông tin DCA"
                description="Tìm hiểu về các thông số trong bảng thông tin DCA"
                leftSection={<BookOpen size={16} color="#307fffff" />}
                active={selectedArticle === 'lesson-2'}
                fw={selectedArticle === 'lesson-2' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('lesson-2');
                  closeMobileNav();
                }}
                color="blue"
              />

              <NavLink
                label="Lesson 3: Hướng dẫn bảng hỗ trợ Trade Tay"
                description="Hướng dẫn sử dụng bảng hỗ trợ giao dịch thủ công"
                leftSection={<BookOpen size={16} color="#307fffff" />}
                active={selectedArticle === 'lesson-3'}
                fw={selectedArticle === 'lesson-3' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('lesson-3');
                  closeMobileNav();
                }}
                color="blue"
              />

              <NavLink
                label="Lesson 4: Hướng dẫn Input (chế độ Auto DCA)"
                description="Hướng dẫn cài đặt các thông số đầu vào cho chế độ Auto DCA"
                leftSection={<BookOpen size={16} color="#307fffff" />}
                active={selectedArticle === 'lesson-4'}
                fw={selectedArticle === 'lesson-4' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('lesson-4');
                  closeMobileNav();
                }}
                color="blue"
              />

              <Text size="xs" fw={700} c="violet" tt="uppercase" mb="xs" mt="md">
                Strategy
              </Text>

              <NavLink
                label="Strategy 1: CHỈ BUY VÀNG"
                description="Gồng được 1000 giá vàng, vẫn lợi nhuận 10%/ tháng"
                leftSection={<TrendingUp size={16} color="violet" />}
                active={selectedArticle === 'strategy-1'}
                fw={selectedArticle === 'strategy-1' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('strategy-1');
                  closeMobileNav();
                }}
                color="violet"
              />

              <NavLink
                label="Strategy 2: FULL MARGIN"
                description="Đánh lỗi đòn bẩy sàn, X2 tài khoản sau 1 cây nến 1 phút"
                leftSection={<TrendingUp size={16} color="violet" />}
                active={selectedArticle === 'strategy-2'}
                fw={selectedArticle === 'strategy-2' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('strategy-2');
                  closeMobileNav();
                }}
                color="violet"
              />

              <NavLink
                label="Strategy 3: NHÂN & TỔNG"
                description="Siêu lợi nhuận cắt chuỗi, giống con MF ( hợp XAUUSD )"
                leftSection={<TrendingUp size={16} color="violet" />}
                active={selectedArticle === 'strategy-3'}
                fw={selectedArticle === 'strategy-3' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('strategy-3');
                  closeMobileNav();
                }}
                color="violet"
              />

              <NavLink
                label="Strategy 4: CỘNG & TỈA"
                description="Siêu an toàn, tốt hơn đầu tư ngân hàng, giống con MG ( hợp AUDCAD )"
                leftSection={<TrendingUp size={16} color="violet" />}
                active={selectedArticle === 'strategy-4'}
                fw={selectedArticle === 'strategy-4' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('strategy-4');
                  closeMobileNav();
                }}
                color="violet"
              />

              <NavLink
                label="Strategy 5: CỘNG & TỔNG"
                description="Vượt 700 pips AUDCAD, sóng lớn nhất lịch sử"
                leftSection={<TrendingUp size={16} color="violet" />}
                active={selectedArticle === 'strategy-5'}
                fw={selectedArticle === 'strategy-5' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('strategy-5');
                  closeMobileNav();
                }}
                color="violet"
              />

              <Text size="xs" fw={700} c="green" tt="uppercase" mb="xs" mt="md">
                Guide
              </Text>

              <NavLink
                label="Guide 1: Hướng dẫn add bot và add bản quyền"
                description="Hướng dẫn chi tiết cách thêm bot và kích hoạt bản quyền"
                leftSection={<FileText size={16} color="green" />}
                active={selectedArticle === 'guide-1'}
                fw={selectedArticle === 'guide-1' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('guide-1');
                  closeMobileNav();
                }}
                color="lime"
              />

              <NavLink
                label="Guide 2: Hướng dẫn cách mở Backtest"
                description="Hướng dẫn chi tiết cách mở chế độ Backtest trên MT4/MT5"
                leftSection={<FileText size={16} color="green" />}
                active={selectedArticle === 'guide-2'}
                fw={selectedArticle === 'guide-2' ? 700 : undefined}
                onClick={() => {
                  setSelectedArticle('guide-2');
                  closeMobileNav();
                }}
                color="lime"
              />
            </Stack>
          </ScrollArea>
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {/* Features Section Tabs */}
          {navigationSection === 'features' && (
            <>
              <Tabs.Panel value="feature-guide">
                <FeatureGuideTab onAsideContentChange={setFeatureGuideAside} />
              </Tabs.Panel>
            </>
          )}

          {/* Learn Section Tabs */}
          {navigationSection === 'learn' && (
            <>
              <Tabs.Panel value="step-by-step">
                <StepByStepTab selectedArticle={selectedArticle} />
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
        </Tabs>
      </AppShell.Main>

      <AppShell.Aside p="md">
        {navigationSection === 'features' && activeTab === 'feature-guide' && (
          featureGuideAside
        )}
        {navigationSection === 'learn' && activeTab === 'profit-calculator' && (
          <SavedResultsAside
            savedResults={savedResults}
            onSelectResult={handleSelectResult}
            onDeleteResult={handleDeleteResult}
            selectedResultId={selectedResult?.id}
          />
        )}
      </AppShell.Aside>

      <AppShell.Footer style={{
        backgroundColor: 'color-mix(in srgb, var(--mantine-color-body), transparent 15%)',
        backdropFilter: 'blur(5px)',
      }}>
        <Container size="100%" h="100%">
          <Group justify="space-between" align="center" h="100%">
            <Group gap="xs" align="center">
              <Image 
                src="/tradi-logo.png" 
                alt="Tradi Logo" 
                width={30} 
                height={30}
                style={{ objectFit: 'contain' }}
              />
              <Text size="sm" c="dimmed">
                © {new Date().getFullYear()} Tradi. {t('allRightsReserved')}
              </Text>
            </Group>
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

      {/* Floating action button for Aside panel */}
      <Affix position={{ bottom: 80, right: 20 }}>
        <Transition transition="slide-up" mounted={shouldShowAside}>
          {(transitionStyles) => (
            <ActionIcon
              size="xl"
              radius="xl"
              variant="filled"
              color={theme.colors.accent[6]}
              onClick={toggleMobileAside}
              style={{
                ...transitionStyles,
                boxShadow: theme.shadows.lg,
                width: 56,
                height: 56,
              }}
              aria-label="Toggle side panel"
            >
              <PanelRight size={24} />
            </ActionIcon>
          )}
        </Transition>
      </Affix>
    </AppShell >
  );
}
