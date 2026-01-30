'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Text, AppShell, useMantineTheme, Tabs, Group, Stack, Button, NavLink, ScrollArea, ActionIcon, Affix, Transition, Badge, Anchor, Menu, UnstyledButton, Avatar, CopyButton, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Users, Library, LogIn, TrendingUp, PanelRight, BookOpen, User, ChevronDown, Settings, LogOut, Diamond, Gem, Star, Award, Medal, Shield, Copy, Check } from 'lucide-react';
import Image from 'next/image';
import { StepByStepTab } from '@/components/tabs/DocumentationTab';
import { GetBotTab } from '@/components/tabs/GetBotTab';
import { LoginTab } from '@/components/tabs/LoginTab';
import PartnerApp from '@/components/partner/PartnerApp';
import PartnerNavBar from '@/components/partner/PartnerNavBar';
import { HeroSection } from '@/components/HeroSection';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AccountInfoTab } from '@/components/account/AccountInfoTab';
import { AccountSettingsTab } from '@/components/account/AccountSettingsTab';
import classes from './page.module.css';

type NavigationSection = 'features' | 'library' | 'login' | 'account';

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
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>('exness');
  const [isPartnerAuthenticated, setIsPartnerAuthenticated] = useState(false);
  const [showPartnerAgreement, setShowPartnerAgreement] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [partnerRank, setPartnerRank] = useState<string>('');
  const [referralId, setReferralId] = useState<string>('');
  const [partnerType, setPartnerType] = useState<string>('');
  const [daysToMonthEnd, setDaysToMonthEnd] = useState<number | null>(null);
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
        setReferralId(e.detail.referralId);
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
    window.addEventListener('focus', handleFocus);

    // Check rank immediately in case it was just set
    const currentRank = localStorage.getItem('partnerRank');
    if (currentRank) {
      setPartnerRank(currentRank);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('partnerRankUpdated', handleRankUpdate as EventListener);
      window.removeEventListener('referralIdUpdated', handleReferralIdUpdate as EventListener);
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
            console.log('[HomePage] Setting referral ID:', data.referralId);
            setReferralId(data.referralId);
          }
          if (data.partnerType) {
            console.log('[HomePage] Setting partner type:', data.partnerType);
            setPartnerType(data.partnerType);
          }
        } else {
          console.log('[HomePage] User is not a partner or rank is empty');
          setPartnerRank('');
          setReferralId('');
          setPartnerType('');
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
    } else if (value === 'library') {
      setActiveTab('documentation');
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
  };

  // Determine if navbar should be shown
  const shouldShowNavbar = (
    (navigationSection === 'library' && activeTab === 'documentation') ||
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

  // Handle user logout
  const handleUserLogout = () => {
    localStorage.removeItem('userId');
    sessionStorage.removeItem('userId');
    setIsUserLoggedIn(false);
    setLoggedInUserId(null);
    setPartnerRank('');
    setReferralId('');
    setPartnerType('');
    // Navigate to documentation tab
    handleNavigationChange('library');
    setActiveTab('documentation');
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
                          'Kim Cương': '95%',
                          'Ruby': '90%',
                          'Bạch Kim': '85%',
                          'Vàng': '80%',
                          'Bạc': '75%',
                          'Đồng': '70%',
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
                              <span>{partnerRank}{percentage && ` - ${percentage}`}</span>
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
                                const partnerTypeDisplay = partnerType === 'DLHT' ? 'Đại lý Hệ Thống' : partnerType === 'DDT' ? 'Đối tác Tradi' : null;
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
                          {daysToMonthEnd !== null && (
                            <Badge
                              variant="light"
                              color="gray"
                              size="lg"
                              className={classes.countdownBanner}
                            >
                              <span className={classes.scrollingText}>
                                {daysToMonthEnd === 0 ? 'Ngày mai sẽ chốt hoa hồng' : (
                                  <>
                                    <span style={{ color: '#FFB81C', fontWeight: 700 }}>{daysToMonthEnd} ngày</span>
                                    {' nữa đến kỳ chốt hoa hồng'}
                                  </>
                                )}
                              </span>
                            </Badge>
                          )}
                        </Group>
                      )}
                    </Group>
                  </Group>
                  <Group gap="md">
                    {isUserLoggedIn && (
                      <button
                        className={`${classes.link} ${navigationSection === 'features' ? classes.linkActive : ''}`}
                        onClick={() => handleNavigationChange('features')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Cổng đối tác
                      </button>
                    )}
                    <button
                      className={`${classes.link} ${navigationSection === 'library' ? classes.linkActive : ''}`}
                      onClick={() => handleNavigationChange('library')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Học viện
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
                            value="documentation"
                            c={activeTab === 'documentation' ? theme.white : undefined}
                            fw={activeTab === 'documentation' ? 700 : undefined}
                          >
                            Tài liệu
                          </Tabs.Tab>
                          {isUserLoggedIn && (
                            <Tabs.Tab
                              value="get-bot"
                              c={activeTab === 'get-bot' ? theme.white : undefined}
                              fw={activeTab === 'get-bot' ? 700 : undefined}
                            >
                              Lấy Bot
                            </Tabs.Tab>
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
                  {isUserLoggedIn && (
                    <Tabs.Panel value="get-bot">
                      <GetBotTab />
                    </Tabs.Panel>
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
                    setActiveTab('documentation');
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
