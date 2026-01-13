'use client';

import { useState } from 'react';
import { Container, Title, Text, AppShell, useMantineTheme, Tabs, Group, Stack, Button, NavLink, ScrollArea, ActionIcon, Affix, Transition, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Compass, Calculator, GraduationCap, TrendingUp, FileText, PanelRight, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { FeatureGuideTab } from '@/components/tabs/FeatureGuideTab';
import { StepByStepTab } from '@/components/tabs/StepByStepTab';
import { GetBotTab } from '@/components/tabs/GetBotTab';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import PartnerApp from '@/components/partner/PartnerApp';
import { HeroSection } from '@/components/HeroSection';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useTranslations } from 'next-intl';
import classes from './page.module.css';

type NavigationSection = 'features' | 'learn';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mobileAsideOpened, { toggle: toggleMobileAside, close: closeMobileAside }] = useDisclosure(false);
  const [navigationSection, setNavigationSection] = useState<NavigationSection>('learn');
  const [activeTab, setActiveTab] = useState<string | null>('step-by-step');
  const [featureGuideAside, setFeatureGuideAside] = useState<React.ReactNode>(null);
  const [selectedArticle, setSelectedArticle] = useState<string>('lesson-1');
  const theme = useMantineTheme();
  const t = useTranslations('common');
  const tTabs = useTranslations('tabs');
  const tNav = useTranslations('navigation');

  // Handle navigation section change
  const handleNavigationChange = (value: string) => {
    setNavigationSection(value as NavigationSection);
    // Set default tab for each section
    if (value === 'features') {
      setActiveTab('exness');
    } else if (value === 'learn') {
      setActiveTab('step-by-step');
    }
    // Close mobile menus when switching sections
    closeMobileAside();
  };

  // Close mobile menus when changing tabs
  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    closeMobileAside();
  };

  // Determine if navbar should be shown
  const shouldShowNavbar = navigationSection === 'learn' && activeTab === 'step-by-step';

  // Determine if aside should be shown
  const shouldShowAside = (navigationSection === 'features' && activeTab === 'feature-guide');

  // Handle loading completion
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Handle hero "Get Started" action
  const handleGetStarted = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowHero(false);
      setNavigationSection('learn');
      setActiveTab('lay-bot');
      setIsTransitioning(false);
    }, 500);
  };

  // Handle logo click to return to hero
  const handleLogoClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowHero(true);
      setIsTransitioning(false);
    }, 300);
  };

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  // Show hero on first visit
  if (showHero) {
    return <HeroSection onGetStarted={handleGetStarted} isExiting={isTransitioning} />;
  }

  return (
    <div className={`${classes.mainWrapper} ${isTransitioning ? classes.transitioning : ''}`}>
      <AppShell
        transitionDuration={500}
        transitionTimingFunction="ease"
        header={{ height: 100 }}
        footer={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !shouldShowNavbar, desktop: !shouldShowNavbar }
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
                  <Group gap="md" style={{ cursor: 'pointer' }} onClick={handleLogoClick}>
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
                    c={navigationSection === 'features' ? 'black' : undefined}
                    leftSection={<Compass size={18} />}
                    onClick={() => handleNavigationChange('features')}
                    visibleFrom="sm"
                    className={classes.glowButton}
                  >
                    {tNav('features')}
                  </Button>
                  <Button
                    variant={navigationSection === 'learn' ? 'filled' : 'subtle'}
                    c={navigationSection === 'learn' ? 'black' : undefined}
                    leftSection={<GraduationCap size={18} />}
                    onClick={() => handleNavigationChange('learn')}
                    visibleFrom="sm"
                    className={classes.glowButton}
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
                      {/* <Tabs.Tab
                        value="feature-guide"
                        c={activeTab === 'feature-guide' ? theme.white : undefined}
                        fw={activeTab === 'feature-guide' ? 700 : undefined}
                      >
                        {tTabs('featureGuide')}
                      </Tabs.Tab> */}
                      <Tabs.Tab
                        value="exness"
                        c={activeTab === 'exness' ? theme.white : undefined}
                        fw={activeTab === 'exness' ? 700 : undefined}
                      >
                        Partner
                      </Tabs.Tab>
                    </>
                  )}
                  {navigationSection === 'learn' && (
                    <>
                      <Tabs.Tab
                        value="lay-bot"
                        c={activeTab === 'lay-bot' ? theme.white : undefined}
                        fw={activeTab === 'lay-bot' ? 700 : undefined}
                      >
                        Lấy Bot
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="step-by-step"
                        c={activeTab === 'step-by-step' ? theme.white : undefined}
                        fw={activeTab === 'step-by-step' ? 700 : undefined}
                      >
                        {tTabs('stepByStep')}
                      </Tabs.Tab>
                    </>
                  )}
                </Tabs.List>
              </Tabs>
              {/* Mobile navigation buttons */}
              <Group gap="xs" hiddenFrom="sm" justify="center">
                <Button
                  variant={navigationSection === 'features' ? 'filled' : 'subtle'}
                  c={navigationSection === 'features' ? 'black' : undefined}
                  leftSection={<Compass size={16} />}
                  onClick={() => handleNavigationChange('features')}
                  size="xs"
                  className={classes.glowButton}
                >
                  {tNav('features')}
                </Button>
                <Button
                  variant={navigationSection === 'learn' ? 'filled' : 'subtle'}
                  c={navigationSection === 'learn' ? 'black' : undefined}
                  leftSection={<GraduationCap size={16} />}
                  onClick={() => handleNavigationChange('learn')}
                  size="xs"
                  className={classes.glowButton}
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
                <Badge
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                  size="lg">
                  Hướng dẫn
                </Badge>

                <NavLink
                  label="1. Thông tin và ý nghĩa Bot"
                  leftSection={<BookOpen size={16} color="#307fffff" />}
                  active={selectedArticle === 'lesson-1'}
                  fw={selectedArticle === 'lesson-1' ? 700 : undefined}
                  onClick={() => setSelectedArticle('lesson-1')}
                  color="blue"
                />

                <NavLink
                  label="2. Bảng thông tin"
                  leftSection={<BookOpen size={16} color="#307fffff" />}
                  active={selectedArticle === 'lesson-2'}
                  fw={selectedArticle === 'lesson-2' ? 700 : undefined}
                  onClick={() => setSelectedArticle('lesson-2')}
                  color="blue"
                />

                <NavLink
                  label="3. Bảng hỗ trợ Trade Tay"
                  leftSection={<BookOpen size={16} color="#307fffff" />}
                  active={selectedArticle === 'lesson-3'}
                  fw={selectedArticle === 'lesson-3' ? 700 : undefined}
                  onClick={() => setSelectedArticle('lesson-3')}
                  color="blue"
                />

                <NavLink
                  label="4. Input chế độ DCA"
                  leftSection={<BookOpen size={16} color="#307fffff" />}
                  active={selectedArticle === 'lesson-4'}
                  fw={selectedArticle === 'lesson-4' ? 700 : undefined}
                  onClick={() => setSelectedArticle('lesson-4')}
                  color="blue"
                />

                <NavLink
                  label="5. Thêm Bot + bản quyền"
                  leftSection={<BookOpen size={16} color="#307fffff" />}
                  active={selectedArticle === 'guide-1'}
                  fw={selectedArticle === 'guide-1' ? 700 : undefined}
                  onClick={() => setSelectedArticle('guide-1')}
                  color="blue"
                />

                <NavLink
                  label="6. Mở Backtest"
                  leftSection={<BookOpen size={16} color="#307fffff" />}
                  active={selectedArticle === 'guide-2'}
                  fw={selectedArticle === 'guide-2' ? 700 : undefined}
                  onClick={() => setSelectedArticle('guide-2')}
                  color="blue"
                />

                <Badge
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'pink', deg: 90 }}
                  size="lg">
                  Chiến lược
                </Badge>

                <NavLink
                  label="1. CHỈ BUY VÀNG"
                  leftSection={<TrendingUp size={16} color="violet" />}
                  active={selectedArticle === 'strategy-1'}
                  fw={selectedArticle === 'strategy-1' ? 700 : undefined}
                  onClick={() => setSelectedArticle('strategy-1')}
                  color="violet"
                />

                <NavLink
                  label="2. FULL MARGIN"
                  leftSection={<TrendingUp size={16} color="violet" />}
                  active={selectedArticle === 'strategy-2'}
                  fw={selectedArticle === 'strategy-2' ? 700 : undefined}
                  onClick={() => setSelectedArticle('strategy-2')}
                  color="violet"
                />

                <NavLink
                  label="3. NHÂN & TỔNG"
                  leftSection={<TrendingUp size={16} color="violet" />}
                  active={selectedArticle === 'strategy-3'}
                  fw={selectedArticle === 'strategy-3' ? 700 : undefined}
                  onClick={() => setSelectedArticle('strategy-3')}
                  color="violet"
                />

                <NavLink
                  label="4. CỘNG & TỈA"
                  leftSection={<TrendingUp size={16} color="violet" />}
                  active={selectedArticle === 'strategy-4'}
                  fw={selectedArticle === 'strategy-4' ? 700 : undefined}
                  onClick={() => setSelectedArticle('strategy-4')}
                  color="violet"
                />

                <NavLink
                  label="5. CỘNG & TỔNG"
                  leftSection={<TrendingUp size={16} color="violet" />}
                  active={selectedArticle === 'strategy-5'}
                  fw={selectedArticle === 'strategy-5' ? 700 : undefined}
                  onClick={() => setSelectedArticle('strategy-5')}
                  color="violet"
                />

              </Stack>
            </ScrollArea>
          )}
        </AppShell.Navbar>

        <AppShell.Main style={{
          backgroundColor: '#000000',
        }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            {/* Features Section Tabs */}
            {navigationSection === 'features' && (
              <>
                <Tabs.Panel value="feature-guide">
                  <FeatureGuideTab onAsideContentChange={setFeatureGuideAside} />
                </Tabs.Panel>
                <Tabs.Panel value="exness">
                  <PartnerApp />
                </Tabs.Panel>
              </>
            )}

            {/* Learn Section Tabs */}
            {navigationSection === 'learn' && (
              <>
                <Tabs.Panel value="step-by-step">
                  <StepByStepTab selectedArticle={selectedArticle} />
                </Tabs.Panel>
                <Tabs.Panel value="lay-bot">
                  <GetBotTab />
                </Tabs.Panel>
              </>
            )}
          </Tabs>
        </AppShell.Main>

        <AppShell.Aside p="md">
          {navigationSection === 'features' && activeTab === 'feature-guide' && (
            featureGuideAside
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
              {/* <Group gap="md">
                <Text size="sm" c="dimmed" component="a" href="#" style={{ textDecoration: 'none' }}>
                  {t('about')}
                </Text>
                <Text size="sm" c="dimmed" component="a" href="#" style={{ textDecoration: 'none' }}>
                  {t('privacy')}
                </Text>
                <Text size="sm" c="dimmed" component="a" href="#" style={{ textDecoration: 'none' }}>
                  {t('terms')}
                </Text>
              </Group> */}
            </Group>
          </Container>
        </AppShell.Footer>

        {/* Floating action button for Aside panel */}
        <Affix position={{ bottom: 80, right: 20 }} hiddenFrom="md">
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
      </AppShell>
    </div>
  );
}
