'use client';

import { useState } from 'react';
import { Container, Title, Text, AppShell, useMantineTheme, Tabs, Group, Stack, Button, NavLink, ScrollArea, ActionIcon, Affix, Transition, Badge, Anchor } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Users, Library, LogIn, TrendingUp, PanelRight, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { StepByStepTab } from '@/components/tabs/DocumentationTab';
import { GetBotTab } from '@/components/tabs/GetBotTab';
import { LoginTab } from '@/components/tabs/LoginTab';
import PartnerApp from '@/components/partner/PartnerApp';
import PartnerNavBar from '@/components/partner/PartnerNavBar';
import { HeroSection } from '@/components/HeroSection';
import { LoadingScreen } from '@/components/LoadingScreen';
import classes from './page.module.css';

type NavigationSection = 'features' | 'library' | 'login';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mobileAsideOpened, { toggle: toggleMobileAside, close: closeMobileAside }] = useDisclosure(false);
  const [navigationSection, setNavigationSection] = useState<NavigationSection>('library');
  const [activeTab, setActiveTab] = useState<string | null>('documentation');
  const [featureGuideAside, setFeatureGuideAside] = useState<React.ReactNode>(null);
  const [partnerAside, setPartnerAside] = useState<React.ReactNode>(null);
  const [selectedArticle, setSelectedArticle] = useState<string>('lesson-1');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isPartnerAuthenticated, setIsPartnerAuthenticated] = useState(false);
  const theme = useMantineTheme();

  // Handle navigation section change
  const handleNavigationChange = (value: string) => {
    setNavigationSection(value as NavigationSection);
    // Set default tab for each section
    if (value === 'features') {
      setActiveTab('partner');
    } else if (value === 'library') {
      setActiveTab('documentation');
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
  const shouldShowNavbar = (
    (navigationSection === 'library' && activeTab === 'documentation') ||
    (navigationSection === 'features' && activeTab === 'partner')
  );

  // Determine if aside should be shown
  const shouldShowAside = (
    (navigationSection === 'features' && activeTab === 'feature-guide' && featureGuideAside !== null) ||
    (navigationSection === 'features' && activeTab === 'partner' && partnerAside !== null)
  );

  // Handle loading completion
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Handle hero "Get Started" action
  const handleGetStarted = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowHero(false);
      setNavigationSection('library');
      setActiveTab('documentation');
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
    <>
      <div className={`${classes.mainWrapper} ${isTransitioning ? classes.transitioning : ''}`}>
        <AppShell
        transitionDuration={500}
        transitionTimingFunction="ease"
        header={{ height: navigationSection === 'login' ? 65 : 100 }}
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
            <Stack gap="md" justify={navigationSection === 'login' ? 'center' : 'end'} h="100%">
              <Group justify="space-between" align="center">
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
                      Việt Nam Chất Lượng Cao
                    </Title>
                  </div>
                </Group>

                <Group gap={0} visibleFrom="sm" h="120%">
                  <a
                    href="#features"
                    className={`${classes.link} ${navigationSection === 'features' ? classes.linkActive : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigationChange('features');
                    }}
                  >
                    Đối tác
                  </a>
                  <a
                    href="#library"
                    className={`${classes.link} ${navigationSection === 'library' ? classes.linkActive : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigationChange('library');
                    }}
                  >
                    Thư viện
                  </a>
                </Group>
                <Group gap="md">
                  <Button
                    variant={navigationSection === 'login' ? 'filled' : 'subtle'}
                    c={navigationSection === 'login' ? 'black' : undefined}
                    leftSection={<LogIn size={18} />}
                    onClick={() => handleNavigationChange('login')}
                    visibleFrom="sm"
                    className={classes.glowButton}
                  >
                    Đăng nhập
                  </Button>
                </Group>
              </Group>
              {navigationSection !== 'login' && (
                <Tabs value={activeTab} onChange={handleTabChange} radius="md">
                  <Tabs.List>
                    {navigationSection === 'features' && (
                      <>
                        <Tabs.Tab
                        value="partner"
                        c={activeTab === 'partner' ? theme.white : undefined}
                        fw={activeTab === 'partner' ? 700 : undefined}
                      >
                        Partner
                      </Tabs.Tab>
                    </>
                  )}
                  {navigationSection === 'library' && (
                    <>
                      <Tabs.Tab
                        value="documentation"
                        c={activeTab === 'documentation' ? theme.white : undefined}
                        fw={activeTab === 'documentation' ? 700 : undefined}
                      >
                        Tài liệu
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="get-bot"
                        c={activeTab === 'get-bot' ? theme.white : undefined}
                        fw={activeTab === 'get-bot' ? 700 : undefined}
                      >
                        Lấy Bot
                      </Tabs.Tab>
                    </>
                  )}
                  </Tabs.List>
                </Tabs>
              )}
              {/* Mobile navigation links */}
              <Group gap="md" hiddenFrom="sm" justify="center">
                <Anchor
                  size="sm"
                  fw={navigationSection === 'features' ? 700 : 500}
                  c={navigationSection === 'features' ? theme.colors.accent[6] : 'dimmed'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigationChange('features');
                  }}
                  href="#features"
                  underline="always"
                >
                  Đối tác
                </Anchor>
                <Anchor
                  size="sm"
                  fw={navigationSection === 'library' ? 700 : 500}
                  c={navigationSection === 'library' ? theme.colors.accent[6] : 'dimmed'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigationChange('library');
                  }}
                  href="#library"
                  underline="always"
                >
                  Thư viện
                </Anchor>
              </Group>
            </Stack>
          </Container>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          {navigationSection === 'features' && activeTab === 'partner' && (
            <PartnerNavBar
              selectedPlatform={selectedPlatform}
              onPlatformSelect={setSelectedPlatform}
              isAuthenticated={isPartnerAuthenticated}
              onLogout={() => setIsPartnerAuthenticated(false)}
            />
          )}
          {navigationSection === 'library' && activeTab === 'documentation' && (
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
                <Tabs.Panel value="partner">
                  <PartnerApp
                    onAsideContentChange={setPartnerAside}
                    selectedPlatform={selectedPlatform}
                    onPlatformSelect={setSelectedPlatform}
                    isAuthenticated={isPartnerAuthenticated}
                    setIsAuthenticated={setIsPartnerAuthenticated}
                  />
                </Tabs.Panel>
              </>
            )}

            {/* Library Section Tabs */}
            {navigationSection === 'library' && (
              <>
                <Tabs.Panel value="documentation">
                  <StepByStepTab selectedArticle={selectedArticle} />
                </Tabs.Panel>
                <Tabs.Panel value="get-bot">
                  <GetBotTab />
                </Tabs.Panel>
              </>
            )}

            {/* Login Section */}
            {navigationSection === 'login' && (
              <LoginTab 
                onLoginSuccess={() => {
                  // Redirect to partner dashboard
                  handleNavigationChange('features');
                }}
              />
            )}
          </Tabs>
        </AppShell.Main>

        <AppShell.Aside p="md">
          {navigationSection === 'features' && activeTab === 'feature-guide' && (
            featureGuideAside
          )}
          {navigationSection === 'features' && activeTab === 'partner' && (
            partnerAside
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
                  © {new Date().getFullYear()} Tradi. Bảo lưu mọi quyền.
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
    </>
  );
}
