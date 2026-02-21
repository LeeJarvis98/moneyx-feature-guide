'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Text, AppShell, useMantineTheme, Tabs, Group, Stack, Button, NavLink, ScrollArea, ActionIcon, Affix, Transition, Badge, Anchor, Menu, UnstyledButton, Avatar, CopyButton, Tooltip, Box, TypographyStylesProvider, Loader, Center } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Users, Library, LogIn, TrendingUp, PanelRight, BookOpen, User, ChevronDown, Settings, LogOut, Diamond, Gem, Star, Award, Medal, Shield, Copy, Check, Wallet, Bot } from 'lucide-react';
import Image from 'next/image';
import { GetBotTab } from '@/components/tabs/GetBotTab';
import { ManageAccountsTab } from '@/components/tabs/ManageAccountsTab';
import { LoginTab } from '@/components/tabs/LoginTab';
import PartnerApp from '@/components/partner/PartnerApp';
import PartnerNavBar from '@/components/partner/PartnerNavBar';
import { HeroSection } from '@/components/HeroSection';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AccountInfoTab } from '@/components/account/AccountInfoTab';
import { AccountSettingsTab } from '@/components/account/AccountSettingsTab';
import { exnessApi } from '@/lib/exness/api';
import classes from './page.module.css';

type NavigationSection = 'features' | 'library' | 'login' | 'account';

// Article Viewer Component
function ArticleViewer({ selectedArticle }: { selectedArticle: string }) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/articles/${selectedArticle}.html`)
      .then((response) => response.text())
      .then((html) => {
        // Extract body content from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyContent = doc.body.innerHTML;
        setHtmlContent(bodyContent);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading article:', error);
        setHtmlContent('<p>Error loading article content.</p>');
        setLoading(false);
      });
  }, [selectedArticle]);

  if (loading) {
    return (
      <Center style={{ height: '400px' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Box style={{ width: '100%' }}>
      <TypographyStylesProvider>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </TypographyStylesProvider>
    </Box>
  );
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mobileAsideOpened, { toggle: toggleMobileAside, close: closeMobileAside }] = useDisclosure(false);
  const [navigationSection, setNavigationSection] = useState<NavigationSection>('library');
  const [activeTab, setActiveTab] = useState<string | null>('guides');
  const [featureGuideAside, setFeatureGuideAside] = useState<React.ReactNode>(null);
  const [partnerAside, setPartnerAside] = useState<React.ReactNode>(null);
  const [selectedArticle, setSelectedArticle] = useState<string>('guide-1');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>('exness');
  const [isPartnerAuthenticated, setIsPartnerAuthenticated] = useState(false);
  const [showPartnerAgreement, setShowPartnerAgreement] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [partnerRank, setPartnerRank] = useState<string>('');
  const [referralId, setReferralId] = useState<string>('');
  const [partnerType, setPartnerType] = useState<string>('');
  const [daysToMonthEnd, setDaysToMonthEnd] = useState<number | null>(null);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const theme = useMantineTheme();

  // Fetch Internet time and calculate days to month end
  useEffect(() => {
    const fetchInternetTime = async () => {
      try {
        const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
        const data = await response.json();
        const currentDate = new Date(data.datetime);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        const currentDay = currentDate.getDate();
        const daysRemaining = lastDayOfMonth - currentDay;
        setDaysToMonthEnd(daysRemaining);
      } catch (error) {
        console.error('[HomePage] Error fetching Internet time:', error);
        // Fallback to local time if Internet time fetch fails
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        const currentDay = currentDate.getDate();
        const daysRemaining = lastDayOfMonth - currentDay;
        setDaysToMonthEnd(daysRemaining);
      }
    };

    fetchInternetTime();
    // Update every hour
    const interval = setInterval(fetchInternetTime, 3600000);

    return () => clearInterval(interval);
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (userId) {
      setIsUserLoggedIn(true);
      setLoggedInUserId(userId);
      // Check partner rank
      checkPartnerRank(userId);
    }

    // Listen for localStorage changes for rank updates (different windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'partnerRank' && e.newValue) {
        setPartnerRank(e.newValue);
      }
    };

    // Listen for custom event for same-window updates
    const handleRankUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.rank) {
        setPartnerRank(e.detail.rank);
      }
    };

    // Listen for referral ID update
    const handleReferralIdUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.referralId) {
        console.log('[HomePage] Received referralIdUpdated event:', e.detail.referralId);
        setReferralId(e.detail.referralId);
        sessionStorage.setItem('referralId', e.detail.referralId);
      }
    };

    // Listen for partner type update
    const handlePartnerTypeUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.partnerType) {
        console.log('[HomePage] Received partnerTypeUpdated event:', e.detail.partnerType);
        setPartnerType(e.detail.partnerType);
        sessionStorage.setItem('partnerType', e.detail.partnerType);
      }
    };

    // Also check rank on focus (for same-window updates)
    const handleFocus = () => {
      const rank = localStorage.getItem('partnerRank');
      if (rank) {
        setPartnerRank(rank);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('partnerRankUpdated', handleRankUpdate as EventListener);
    window.addEventListener('referralIdUpdated', handleReferralIdUpdate as EventListener);
    window.addEventListener('partnerTypeUpdated', handlePartnerTypeUpdate as EventListener);
    window.addEventListener('focus', handleFocus);

    // Check rank and referralId immediately in case they were just set
    const currentRank = localStorage.getItem('partnerRank');
    if (currentRank) {
      setPartnerRank(currentRank);
    }
    const currentReferralId = sessionStorage.getItem('referralId');
    if (currentReferralId) {
      console.log('[HomePage] Found referralId in sessionStorage:', currentReferralId);
      setReferralId(currentReferralId);
    }
    const currentPartnerType = sessionStorage.getItem('partnerType');
    if (currentPartnerType) {
      console.log('[HomePage] Found partnerType in sessionStorage:', currentPartnerType);
      setPartnerType(currentPartnerType);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('partnerRankUpdated', handleRankUpdate as EventListener);
      window.removeEventListener('referralIdUpdated', handleReferralIdUpdate as EventListener);
      window.removeEventListener('partnerTypeUpdated', handlePartnerTypeUpdate as EventListener);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Function to check partner rank and partner type
  const checkPartnerRank = async (userId: string) => {
    console.log('[HomePage] Checking partner rank for userId:', userId);
    try {
      const response = await fetch('/api/check-partner-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: userId }),
      });

      console.log('[HomePage] Partner status response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[HomePage] Partner status data:', data);
        if (data.isPartner && data.rank) {
          console.log('[HomePage] Setting partner rank:', data.rank);
          setPartnerRank(data.rank);
          if (data.referralId) {
            console.log('[HomePage] Setting referral ID from API:', data.referralId);
            setReferralId(data.referralId);
            sessionStorage.setItem('referralId', data.referralId);
          }
          if (data.partnerType) {
            console.log('[HomePage] Setting partner type:', data.partnerType);
            setPartnerType(data.partnerType);
            sessionStorage.setItem('partnerType', data.partnerType);
          }
        } else {
          console.log('[HomePage] User is not a partner or rank is empty');
          setPartnerRank('');
          setReferralId('');
          setPartnerType('');
          sessionStorage.removeItem('referralId');
          sessionStorage.removeItem('partnerType');
        }
      }
    } catch (error) {
      console.error('[HomePage] Error checking partner rank:', error);
    }
  };

  // Handle navigation section change
  const handleNavigationChange = (value: string) => {
    setNavigationSection(value as NavigationSection);
    // Set default tab for each section
    if (value === 'features') {
      setActiveTab('partner');
      // Clear partner authentication when clicking "Cổng đối tác"
      console.log('[HomePage] Navigating to features, clearing partner session');
      setIsPartnerAuthenticated(false);
      // Clear partner session using exnessApi
      exnessApi.clearToken();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('partnerId');
        sessionStorage.removeItem('platformToken');
      }
      console.log('[HomePage] Partner session cleared');
      // Refresh partner data when navigating to features
      if (loggedInUserId) {
        checkPartnerRank(loggedInUserId);
      }
    } else if (value === 'library') {
      setActiveTab('guides');
    } else if (value === 'account') {
      // Keep the tab as set by menu item click
      if (!activeTab || (!activeTab.startsWith('account'))) {
        setActiveTab('account-info');
      }
    }
    // Close mobile menus when switching sections
    closeMobileAside();
    // Reset partner agreement visibility
    setShowPartnerAgreement(false);
  };

  // Close mobile menus when changing tabs
  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    closeMobileAside();
    // Reset partner agreement visibility when changing tabs
    setShowPartnerAgreement(false);
    // Set default article when switching to guides or strategies
    if (value === 'guides') {
      setSelectedArticle('guide-1');
    } else if (value === 'strategies') {
      setSelectedArticle('strategy-1');
    }
  };

  // Determine if navbar should be shown
  const shouldShowNavbar = (
    (navigationSection === 'library' && (activeTab === 'guides' || activeTab === 'strategies')) ||
    (navigationSection === 'features' && activeTab === 'partner' && !showPartnerAgreement)
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
      setActiveTab('guides');
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

  // Handle user logout
  const handleUserLogout = () => {
    // Clear user session
    localStorage.removeItem('userId');
    sessionStorage.removeItem('userId');

    // Clear partner-related data
    localStorage.removeItem('partnerRank');
    sessionStorage.removeItem('referralId');
    sessionStorage.removeItem('partnerPlatformData');
    sessionStorage.removeItem('partnerType');

    // Clear partner authentication using exnessApi
    exnessApi.clearToken();
    sessionStorage.removeItem('partnerId');
    sessionStorage.removeItem('platformToken');

    // Reset all user and partner states
    setIsUserLoggedIn(false);
    setLoggedInUserId(null);
    setPartnerRank('');
    setReferralId('');
    setPartnerType('');
    setIsPartnerAuthenticated(false);
    setSelectedPlatform(null);

    // Navigate to documentation tab
    handleNavigationChange('library');
    setActiveTab('guides');
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
                    <Title order={1} size="h2" c={theme.colors.accent[6]}>
                      Việt Nam Chất Lượng Cao
                    </Title>
                    <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                      {isUserLoggedIn && partnerRank && partnerRank !== 'None' && partnerRank !== 'ADMIN' && (() => {
                        const rankIcons: Record<string, typeof Diamond> = {
                          'Kim Cương': Gem,
                          'Ruby': Diamond,
                          'Bạch Kim': Star,
                          'Vàng': Award,
                          'Bạc': Medal,
                          'Đồng': Shield,
                        };
                        const rankPercentages: Record<string, string> = {
                          'Kim Cương': '90%',
                          'Ruby': '85%',
                          'Bạch Kim': '80%',
                          'Vàng': '75%',
                          'Bạc': '70%',
                          'Đồng': '65%',
                        };
                        const rankStyles: Record<string, { variant?: 'gradient' | 'filled', gradient?: { from: string; to: string; deg: number }, color?: string, className: string }> = {
                          'Kim Cương': { variant: 'gradient', gradient: { from: 'cyan', to: 'white', deg: 90 }, className: classes.rankBadgeKimCuong },
                          'Ruby': { variant: 'gradient', gradient: { from: 'red', to: 'violet', deg: 90 }, className: classes.rankBadgeRuby },
                          'Bạch Kim': { variant: 'gradient', gradient: { from: 'gray.1', to: 'gray.4', deg: 90 }, className: classes.rankBadgeBachKim },
                          'Vàng': { variant: 'filled', color: 'yellow', className: classes.rankBadgeVang },
                          'Bạc': { variant: 'filled', color: 'gray.7', className: classes.rankBadgeBac },
                          'Đồng': { variant: 'filled', color: 'orange.9', className: classes.rankBadgeDong },
                        };
                        const RankIcon = rankIcons[partnerRank];
                        const percentage = rankPercentages[partnerRank];
                        const style = rankStyles[partnerRank];
                        return (
                          <Badge
                            variant={style?.variant || 'gradient'}
                            gradient={style?.gradient}
                            color={style?.color}
                            size="lg"
                            className={`${classes.rankBadge} ${style?.className || ''}`}
                          >
                            <span className={classes.rankBadgeContent}>
                              {RankIcon && (
                                <span className={classes.rankIcon}>
                                  <RankIcon size={18} />
                                </span>
                              )}
                              <span>{partnerRank}{percentage && `: ${percentage}`}</span>
                            </span>
                          </Badge>
                        );
                      })()}
                      {isUserLoggedIn && referralId && (
                        <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                          <Group
                            gap="xs"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(255, 184, 28, 0.1)',
                              border: '1px solid rgba(255, 184, 28, 0.3)',
                            }}
                          >
                            <Text size="sm" fw={600} c="yellow">
                              {(() => {
                                const partnerTypeDisplay = partnerType === 'DLHT' ? 'Đại lý Hệ Thống' : partnerType === 'DTT' ? 'Đối tác Tradi' : null;
                                return partnerTypeDisplay ? `${partnerTypeDisplay} | Mã giới thiệu:` : 'Mã giới thiệu:';
                              })()}
                            </Text>
                            <Text size="sm" fw={600} c="white" style={{ fontFamily: 'monospace' }}>
                              {referralId}
                            </Text>
                            <CopyButton value={referralId} timeout={2000}>
                              {({ copied, copy }) => (
                                <Tooltip label={copied ? 'Đã sao chép!' : 'Sao chép mã giới thiệu'} withArrow position="bottom">
                                  <ActionIcon
                                    color={copied ? 'teal' : 'yellow'}
                                    variant="subtle"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copy();
                                    }}
                                    size="sm"
                                  >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </CopyButton>
                          </Group>
                        </Group>
                      )}
                    </Group>
                  </Group>
                  <Group gap="md">
                    {isUserLoggedIn && (
                      <button
                        className={`${classes.link} ${classes.buttonReset} ${navigationSection === 'features' ? classes.linkActive : ''}`}
                        onClick={() => handleNavigationChange('features')}
                      >
                        Cổng đối tác
                      </button>
                    )}
                    <button
                      className={`${classes.link} ${classes.buttonReset} ${navigationSection === 'library' ? classes.linkActive : ''}`}
                      onClick={() => handleNavigationChange('library')}
                    >
                      Khách hàng
                    </button>
                    {!isUserLoggedIn ? (
                      <Button
                        variant={navigationSection === 'login' ? 'light' : 'filled'}
                        c={navigationSection === 'login' ? undefined : 'black'}
                        leftSection={<LogIn size={18} />}
                        onClick={() => handleNavigationChange('login')}
                        visibleFrom="sm"
                        className={classes.glowButton}
                      >
                        Đăng nhập
                      </Button>
                    ) : (
                      <Menu
                        width={260}
                        position="bottom-end"
                        transitionProps={{ transition: 'pop-top-right' }}
                      >
                        <Menu.Target>
                          <UnstyledButton
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              transition: 'background-color 0.2s',
                              backgroundColor: 'transparent',
                            }}
                          >
                            <Avatar
                              radius="xl"
                              size={32}
                              style={{
                                background: 'linear-gradient(135deg, #FFB81C 0%, #FFA000 100%)',
                              }}
                            >
                              <User size={18} color="#000000" />
                            </Avatar>
                            <Text size="sm" fw={500} c="white" visibleFrom="sm">
                              {loggedInUserId}
                            </Text>
                            <ChevronDown size={16} color="white" style={{ opacity: 0.6 }} />
                          </UnstyledButton>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<User size={16} />}
                            onClick={() => {
                              handleNavigationChange('account');
                              setActiveTab('account-info');
                            }}
                          >
                            Thông tin tài khoản
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<Settings size={16} />}
                            onClick={() => {
                              handleNavigationChange('account');
                              setActiveTab('account-settings');
                            }}
                          >
                            Cài đặt
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<LogOut size={16} />}
                            onClick={handleUserLogout}
                          >
                            Đăng xuất
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
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
                            value="guides"
                            c={activeTab === 'guides' ? theme.white : undefined}
                            fw={activeTab === 'guides' ? 700 : undefined}
                          >
                            Hướng dẫn
                          </Tabs.Tab>
                          <Tabs.Tab
                            value="strategies"
                            c={activeTab === 'strategies' ? theme.white : undefined}
                            fw={activeTab === 'strategies' ? 700 : undefined}
                          >
                            Chiến lược
                          </Tabs.Tab>
                          {isUserLoggedIn && (
                            <>
                              <Tabs.Tab
                                value="get-bot"
                                c={activeTab === 'get-bot' ? theme.white : undefined}
                                fw={activeTab === 'get-bot' ? 700 : undefined}
                              >
                                Lấy Bot
                              </Tabs.Tab>
                              <Tabs.Tab
                                value="manage-accounts"
                                c={activeTab === 'manage-accounts' ? theme.white : undefined}
                                fw={activeTab === 'manage-accounts' ? 700 : undefined}
                              >
                                Bản quyền
                              </Tabs.Tab>
                            </>
                          )}
                        </>
                      )}
                      {navigationSection === 'account' && (
                        <>
                          <Tabs.Tab
                            value="account-info"
                            c={activeTab === 'account-info' ? theme.white : undefined}
                            fw={activeTab === 'account-info' ? 700 : undefined}
                          >
                            Thông tin chung
                          </Tabs.Tab>
                          <Tabs.Tab
                            value="account-settings"
                            c={activeTab === 'account-settings' ? theme.white : undefined}
                            fw={activeTab === 'account-settings' ? 700 : undefined}
                          >
                            Cài đặt tài khoản
                          </Tabs.Tab>
                        </>
                      )}
                    </Tabs.List>
                  </Tabs>
                )}
                {/* Mobile navigation links */}
                <Group gap="md" hiddenFrom="sm" justify="center">
                  {isUserLoggedIn && (
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
                  )}
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
            {navigationSection === 'features' && activeTab === 'partner' && !showPartnerAgreement && (
              <PartnerNavBar
                selectedPlatform={selectedPlatform}
                onPlatformSelect={setSelectedPlatform}
                isAuthenticated={isPartnerAuthenticated}
                onLogout={() => setIsPartnerAuthenticated(false)}
                onLoadingChange={setLoadingPlatforms}
              />
            )}
            {navigationSection === 'library' && activeTab === 'guides' && (
              <ScrollArea h="100%" type="auto" offsetScrollbars>
                <Stack gap="xs">
                  <Badge
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                    size="lg">
                    Hướng dẫn
                  </Badge>

                  <NavLink
                    label="1. Trade Tay"
                    leftSection={<BookOpen size={16} color="#307fffff" />}
                    active={selectedArticle === 'guide-1'}
                    fw={selectedArticle === 'guide-1' ? 700 : undefined}
                    onClick={() => setSelectedArticle('guide-1')}
                    color="blue"
                  />

                  <NavLink
                    label="2. Auto DCA"
                    leftSection={<BookOpen size={16} color="#307fffff" />}
                    active={selectedArticle === 'guide-2'}
                    fw={selectedArticle === 'guide-2' ? 700 : undefined}
                    onClick={() => setSelectedArticle('guide-2')}
                    color="blue"
                  />

                  <NavLink
                    label="3. AI Trade"
                    leftSection={<BookOpen size={16} color="#307fffff" />}
                    active={selectedArticle === 'guide-3'}
                    fw={selectedArticle === 'guide-3' ? 700 : undefined}
                    onClick={() => setSelectedArticle('guide-3')}
                    color="blue"
                  />

                  <NavLink
                    label="4. TP - Tổng, Tỉa, Đơn"
                    leftSection={<BookOpen size={16} color="#307fffff" />}
                    active={selectedArticle === 'guide-4'}
                    fw={selectedArticle === 'guide-4' ? 700 : undefined}
                    onClick={() => setSelectedArticle('guide-4')}
                    color="blue"
                  />
                </Stack>
              </ScrollArea>
            )}
            {navigationSection === 'library' && activeTab === 'strategies' && (
              <ScrollArea h="100%" type="auto" offsetScrollbars>
                <Stack gap="xs">
                  <Badge
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'pink', deg: 90 }}
                    size="lg">
                    Chiến lược
                  </Badge>

                  <NavLink
                    label="1. Mở Lệnh TP SL Nhanh"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-1'}
                    fw={selectedArticle === 'strategy-1' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-1')}
                    color="violet"
                  />

                  <NavLink
                    label="2. Mở Lệnh Kiểm Soát"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-2'}
                    fw={selectedArticle === 'strategy-2' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-2')}
                    color="violet"
                  />

                  <NavLink
                    label="3. 100 Lệnh Trong 1 Giây"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-3'}
                    fw={selectedArticle === 'strategy-3' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-3')}
                    color="violet"
                  />

                  <NavLink
                    label="4. BE - Auto Dời SL về Entry"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-4'}
                    fw={selectedArticle === 'strategy-4' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-4')}
                    color="violet"
                  />

                  <NavLink
                    label="5. Trailing Stop - Auto Dời Theo Lãi"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-5'}
                    fw={selectedArticle === 'strategy-5' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-5')}
                    color="violet"
                  />

                  <NavLink
                    label="6. Partipal - Auto Chốt 1 Nửa TP Trước"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-6'}
                    fw={selectedArticle === 'strategy-6' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-6')}
                    color="violet"
                  />

                  <NavLink
                    label="7. BE + Part - Chốt Lãi Hòa"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-7'}
                    fw={selectedArticle === 'strategy-7' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-7')}
                    color="violet"
                  />

                  <NavLink
                    label="8. Trail + Part - Chốt Lãi Tăng Theo"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-8'}
                    fw={selectedArticle === 'strategy-8' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-8')}
                    color="violet"
                  />

                  <NavLink
                    label="9. Chốt 25-50-75"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-9'}
                    fw={selectedArticle === 'strategy-9' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-9')}
                    color="violet"
                  />

                  <NavLink
                    label="10. Trade Tay + AI Trade"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-10'}
                    fw={selectedArticle === 'strategy-10' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-10')}
                    color="violet"
                  />

                  <NavLink
                    label="11. Mặc Định Bot VNCLC"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-11'}
                    fw={selectedArticle === 'strategy-11' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-11')}
                    color="violet"
                  />

                  <NavLink
                    label="12. Nhân + Tổng (EMA)"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-12'}
                    fw={selectedArticle === 'strategy-12' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-12')}
                    color="violet"
                  />

                  <NavLink
                    label="13. Nhân + Tỉa (EMA)"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-13'}
                    fw={selectedArticle === 'strategy-13' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-13')}
                    color="violet"
                  />

                  <NavLink
                    label="14. Cộng + Tổng (EMA)"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-14'}
                    fw={selectedArticle === 'strategy-14' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-14')}
                    color="violet"
                  />

                  <NavLink
                    label="15. Cộng + Tỉa (EMA)"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-15'}
                    fw={selectedArticle === 'strategy-15' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-15')}
                    color="violet"
                  />

                  <NavLink
                    label="16. DCA + Trend"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-16'}
                    fw={selectedArticle === 'strategy-16' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-16')}
                    color="violet"
                  />

                  <NavLink
                    label="17. Đều + Đơn - Chỉ Buy Vàng"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-17'}
                    fw={selectedArticle === 'strategy-17' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-17')}
                    color="violet"
                  />

                  <NavLink
                    label="18. 1%/Ngày + Thời Gian (Kiểm Soát)"
                    leftSection={<TrendingUp size={16} color="violet" />}
                    active={selectedArticle === 'strategy-18'}
                    fw={selectedArticle === 'strategy-18' ? 700 : undefined}
                    onClick={() => setSelectedArticle('strategy-18')}
                    color="violet"
                  />
                </Stack>
              </ScrollArea>
            )}
          </AppShell.Navbar>

          <AppShell.Main style={{
            backgroundColor: '#000000',
            ...(showPartnerAgreement && {
              paddingTop: '100px',
              paddingLeft: '0px',
              paddingRight: '0px',
              paddingBottom: '60px',
            }),
          }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              {/* Features Section Tabs */}
              {isUserLoggedIn && navigationSection === 'features' && (
                <>
                  <Tabs.Panel value="partner">
                    <PartnerApp
                      onAsideContentChange={setPartnerAside}
                      selectedPlatform={selectedPlatform}
                      onPlatformSelect={setSelectedPlatform}
                      isAuthenticated={isPartnerAuthenticated}
                      setIsAuthenticated={setIsPartnerAuthenticated}
                      onAgreementVisibilityChange={setShowPartnerAgreement}
                      partnerRank={partnerRank}
                      loadingPlatforms={loadingPlatforms}
                    />
                  </Tabs.Panel>
                </>
              )}

              {/* Library Section Tabs */}
              {navigationSection === 'library' && (
                <>
                  <Tabs.Panel value="guides">
                    <ArticleViewer selectedArticle={selectedArticle} />
                  </Tabs.Panel>
                  <Tabs.Panel value="strategies">
                    <ArticleViewer selectedArticle={selectedArticle} />
                  </Tabs.Panel>
                  {isUserLoggedIn && (
                    <>
                      <Tabs.Panel value="get-bot">
                        <GetBotTab isActive={activeTab === 'get-bot'} />
                      </Tabs.Panel>
                      <Tabs.Panel value="manage-accounts">
                        <ManageAccountsTab isActive={activeTab === 'manage-accounts'} />
                      </Tabs.Panel>
                    </>
                  )}
                </>
              )}

              {/* Login Section */}
              {navigationSection === 'login' && (
                <LoginTab
                  onLoginSuccess={(userId, partnerRank, ownReferralId, partnerType) => {
                    // Update parent state
                    setIsUserLoggedIn(true);
                    setLoggedInUserId(userId);
                    // Set partner rank from login response and save to localStorage
                    if (partnerRank) {
                      setPartnerRank(partnerRank);
                      localStorage.setItem('partnerRank', partnerRank);
                    } else {
                      setPartnerRank('');
                      localStorage.removeItem('partnerRank');
                    }
                    // Set referral ID if provided
                    if (ownReferralId) {
                      setReferralId(ownReferralId);
                    }
                    // Set partner type if provided
                    if (partnerType) {
                      setPartnerType(partnerType);
                    }
                    // Redirect to documentation
                    handleNavigationChange('library');
                    setActiveTab('guides');
                  }}
                />
              )}

              {/* Account Section */}
              {navigationSection === 'account' && loggedInUserId && (
                <>
                  <Tabs.Panel value="account-info">
                    <AccountInfoTab userId={loggedInUserId} />
                  </Tabs.Panel>
                  <Tabs.Panel value="account-settings">
                    <AccountSettingsTab userId={loggedInUserId} />
                  </Tabs.Panel>
                </>
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
                  {daysToMonthEnd !== null && (
                    <Badge
                      variant="light"
                      color="gray"
                      size="lg"
                      className={classes.countdownBanner}
                    >
                      <span className={classes.scrollingText}>
                        {daysToMonthEnd === 0 ? (
                          <>
                            <span className={classes.highlightText}>Ngày mai</span>
                            {' sẽ chốt hoa hồng'}
                          </>
                        ) : (
                          <>
                            <span className={classes.highlightText}>{daysToMonthEnd} ngày</span>
                            {' nữa đến kỳ chốt hoa hồng'}
                          </>
                        )}
                      </span>
                    </Badge>
                  )}
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
