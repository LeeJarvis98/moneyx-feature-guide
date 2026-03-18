'use client';

import { useState, useEffect, useRef } from 'react';
import { Container, Title, Text, AppShell, useMantineTheme, Tabs, Group, Stack, Button, NavLink, ScrollArea, ActionIcon, Affix, Transition, Badge, Menu, UnstyledButton, Avatar, CopyButton, Tooltip, Drawer, Burger, Divider, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Users, Library, LogIn, TrendingUp, PanelRight, PanelLeft, BookOpen, User, ChevronDown, Settings, LogOut, Shield, Copy, Check, Wallet, Bot, Zap, Download, Gift } from 'lucide-react';
import Image from 'next/image';
import { GetBotTab } from '@/components/tabs/GetBotTab';
import { ManageAccountsTab } from '@/components/tabs/ManageAccountsTab';
import { LoginTab } from '@/components/tabs/LoginTab';
import { ArticleViewer } from '@/components/tabs/DocumentationTab';
import PartnerApp from '@/components/partner/PartnerApp';
import PartnerNavBar from '@/components/partner/PartnerNavBar';
import PartnerAgreement from '@/components/partner/PartnerAgreement';
import CongratulationsModal from '@/components/partner/CongratulationsModal';
import { HeroSection } from '@/components/HeroSection';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AccountInfoTab } from '@/components/account/AccountInfoTab';
import { AccountSettingsTab } from '@/components/account/AccountSettingsTab';
import { RewardSystemTab } from '@/components/tabs/RewardSystemTab';
import { exnessApi } from '@/lib/exness/api';
import classes from './page.module.css';

type NavigationSection = 'features' | 'library' | 'login' | 'account' | 'reward';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showHero, setShowHero] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mobileAsideOpened, { toggle: toggleMobileAside, close: closeMobileAside }] = useDisclosure(false);
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [mobileNavbarOpened, { toggle: toggleMobileNavbar, close: closeMobileNavbar }] = useDisclosure(false);
  const [navigationSection, setNavigationSection] = useState<NavigationSection>('library');
  const [activeTab, setActiveTab] = useState<string | null>('guides');
  const [featureGuideAside, setFeatureGuideAside] = useState<React.ReactNode>(null);
  const [partnerAside, setPartnerAside] = useState<React.ReactNode>(null);
  const [getBotAside, setGetBotAside] = useState<React.ReactNode>(null);
  const [manageAccountsSection, setManageAccountsSection] = useState<'license' | 'get-bot'>('license');
  const [manageAccountsAside, setManageAccountsAside] = useState<React.ReactNode>(null);
  const [selectedArticle, setSelectedArticle] = useState<string>('guide-1');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>('exness');
  const [isPartnerAuthenticated, setIsPartnerAuthenticated] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [isActivePartner, setIsActivePartner] = useState(false);
  const [referralId, setReferralId] = useState<string>('');
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<string>('active');
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  // Invocation counter: lets us discard results from stale in-flight checkPartnerRank calls
  const checkPartnerRankCallId = useRef(0);
  const theme = useMantineTheme();

  // Check if user is logged in on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (userId) {
      setIsUserLoggedIn(true);
      setLoggedInUserId(userId);
      // Check partner rank
      checkPartnerRank(userId);
    }

    // Listen for referral ID update
    const handleReferralIdUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.referralId) {
        setReferralId(e.detail.referralId);
        sessionStorage.setItem('referralId', e.detail.referralId);
        localStorage.setItem('referralId', e.detail.referralId);
      }
    };

    // Re-check rank from the server whenever the tab regains focus.
    // This ensures that confirming an email in another tab is reflected immediately
    // without the user having to navigate. We read userId fresh from storage so
    // the stale closure is not an issue.
    const handleFocus = () => {
      const uid = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (uid) {
        checkPartnerRank(uid);
      }
    };

    window.addEventListener('referralIdUpdated', handleReferralIdUpdate as EventListener);
    window.addEventListener('focus', handleFocus);

    const currentReferralId = localStorage.getItem('referralId') || sessionStorage.getItem('referralId');
    if (currentReferralId) {
      setReferralId(currentReferralId);
      // Ensure it's in both storages
      localStorage.setItem('referralId', currentReferralId);
      sessionStorage.setItem('referralId', currentReferralId);
    }

    return () => {
      window.removeEventListener('referralIdUpdated', handleReferralIdUpdate as EventListener);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Function to check partner rank and partner type
  const checkPartnerRank = async (userId: string) => {
    // Stamp this invocation. If a newer call starts before this one resolves,
    // the result of this call will be silently discarded to prevent stale writes.
    const callId = ++checkPartnerRankCallId.current;
    try {
      const response = await fetch('/api/check-partner-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: userId }),
      });

      // Discard if a newer invocation has already started
      if (callId !== checkPartnerRankCallId.current) return;

      if (response.ok) {
        const data = await response.json();

        // Discard stale result once more after the async json() parse
        if (callId !== checkPartnerRankCallId.current) return;

        if (data.isPartner) {
          setIsActivePartner(true);
          // Track partner activation status
          const status = data.partnerStatus ?? 'active';
          setPartnerStatus(status);
          setTokenExpiresAt(data.agreementTokenExpiresAt ?? null);

          // Show congratulations modal when a newly confirmed partner visits for the first time
          if (status === 'active' && !data.congratsShown) {
            setShowCongratulations(true);
          }

          if (data.referralId) {
            setReferralId(data.referralId);
            sessionStorage.setItem('referralId', data.referralId);
            localStorage.setItem('referralId', data.referralId);
          }
        } else {
          setIsActivePartner(false);
          setReferralId('');
          sessionStorage.removeItem('referralId');
          localStorage.removeItem('referralId');
        }
      }
    } catch (error) {
      console.error('[HomePage] Error checking partner rank:', error);
    }
  };

  // Determine if user is an active partner (confirmed email)
  const isPartner = isActivePartner && partnerStatus !== 'inactive';

  // Handle navigation section change
  const handleNavigationChange = (value: string) => {
    setNavigationSection(value as NavigationSection);
    // Set default tab for each section
    if (value === 'features') {
      // Show partner tab first for existing partners, agreement for non-partners
      setActiveTab(isPartner ? 'partner' : 'agreement');
      // Clear partner authentication when clicking "Cổng đối tác"
      setIsPartnerAuthenticated(false);
      // Clear partner session using exnessApi
      exnessApi.clearToken();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('partnerId');
        sessionStorage.removeItem('platformToken');
      }
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
    } else if (value === 'reward') {
      setActiveTab('reward');
    }
    // Close mobile menus when switching sections
    closeMobileAside();
    closeMobileNavbar();
  };

  // Close mobile menus when changing tabs
  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    closeMobileAside();
    closeMobileNavbar();
    // Set default article when switching to guides or strategies
    if (value === 'guides') {
      setSelectedArticle('guide-1');
    } else if (value === 'strategies') {
      setSelectedArticle('strategy-1');
    }
  };

  // Determine if navbar should be shown
  const shouldShowNavbar = (
    (navigationSection === 'library' && (activeTab === 'guides' || activeTab === 'strategies' || activeTab === 'manage-accounts')) ||
    (navigationSection === 'features' && activeTab === 'partner')
  );

  // Determine if aside should be shown
  const shouldShowAside = (
    (navigationSection === 'features' && activeTab === 'feature-guide' && featureGuideAside !== null) ||
    (navigationSection === 'features' && activeTab === 'partner' && partnerAside !== null) ||
    (navigationSection === 'library' && activeTab === 'get-bot' && getBotAside !== null) ||
    (navigationSection === 'library' && activeTab === 'manage-accounts' && manageAccountsAside !== null)
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
    localStorage.removeItem('referralId');
    sessionStorage.removeItem('referralId');
    sessionStorage.removeItem('partnerPlatformData');

    // Clear partner authentication using exnessApi
    exnessApi.clearToken();
    sessionStorage.removeItem('partnerId');
    sessionStorage.removeItem('platformToken');

    // Reset all user and partner states
    setIsUserLoggedIn(false);
    setLoggedInUserId(null);
    setIsActivePartner(false);
    setReferralId('');
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
          header={{ height: navigationSection === 'login' ? 65 : { base: 65, sm: 100 } }}
          footer={{ height: { base: 0, sm: 60 } }}
          navbar={{
            width: 300,
            breakpoint: 'sm',
            collapsed: { mobile: !mobileNavbarOpened, desktop: !shouldShowNavbar }
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
                  <Group gap="xs" align="center">
                    <Burger
                      hiddenFrom="sm"
                      opened={drawerOpened}
                      onClick={toggleDrawer}
                      size="sm"
                      color={theme.colors.accent[5]}
                      aria-label="Mở menu điều hướng"
                    />
                    <Group gap="md" style={{ cursor: 'pointer' }} onClick={handleLogoClick} align="center">
                    <Image
                      src="/vnclc-logo.png"
                      alt="VNCLC Logo"
                      width={90.53}
                      height={20}
                      priority
                    />
                    <Title order={1} size="h2" c={theme.colors.accent[6]} visibleFrom="sm">
                      Việt Nam Chất Lượng Cao
                    </Title>
                    <Group gap="xs" onClick={(e) => e.stopPropagation()} visibleFrom="sm">
                      {/* Partner status badge */}
                      {isUserLoggedIn && !isActivePartner && (
                        <Badge
                          variant="outline"
                          color="gray"
                          size="lg"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigationChange('features');
                            setActiveTab('agreement');
                          }}
                        >
                          Chưa là đối tác
                        </Badge>
                      )}
                      {isUserLoggedIn && isActivePartner && (
                        <Badge
                          size="lg"
                          className={classes.partnerBadge}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigationChange('features');
                            setActiveTab('partner');
                          }}
                        >
                          Đối tác Tradi
                        </Badge>
                      )}
                      
                      {/* Show referral ID or N/A */}
                      {isUserLoggedIn && (
                        <Group
                          gap="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isActivePartner || partnerStatus === 'inactive') {
                              handleNavigationChange('features');
                            }
                          }}
                          visibleFrom="sm"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 184, 28, 0.1)',
                            border: '1px solid rgba(255, 184, 28, 0.3)',
                            cursor: (!isActivePartner || partnerStatus === 'inactive') ? 'pointer' : 'default',
                          }}
                        >
                          <Text size="sm" fw={600} c="yellow">
                            Mã giới thiệu:
                          </Text>
                          <Text size="sm" fw={600} c="white" style={{ fontFamily: 'monospace' }}>
                            {referralId || 'N/A'}
                          </Text>
                          {referralId && (
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
                          )}
                        </Group>
                      )}
                    </Group>
                    </Group>
                  </Group>
                  <Group gap="md">
                    {isUserLoggedIn && (
                      <Box visibleFrom="sm">
                        <button
                          className={`${classes.link} ${classes.buttonReset} ${navigationSection === 'features' ? classes.linkActive : ''}`}
                          onClick={() => handleNavigationChange('features')}
                        >
                          Đối tác Tradi
                        </button>
                      </Box>
                    )}
                    <Box visibleFrom="sm">
                      <button
                        className={`${classes.link} ${classes.buttonReset} ${navigationSection === 'library' ? classes.linkActive : ''}`}
                        onClick={() => handleNavigationChange('library')}
                      >
                        Cá nhân
                      </button>
                    </Box>
                    {isUserLoggedIn && (
                      <Box visibleFrom="sm">
                        <button
                          className={`${classes.rewardButton} ${classes.buttonReset}`}
                          onClick={() => handleNavigationChange('reward')}
                        >
                          Hệ Thống Thưởng
                        </button>
                      </Box>
                    )}
                    {!isUserLoggedIn ? (
                      <Button
                        variant={navigationSection === 'login' ? 'light' : 'filled'}
                        c={navigationSection === 'login' ? undefined : 'black'}
                        leftSection={<LogIn size={18} />}
                        onClick={() => handleNavigationChange('login')}
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
                          </UnstyledButton>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item>
                            <Text size="sm" fw={500} c="white" visibleFrom="sm">
                              {loggedInUserId}
                            </Text>
                          </Menu.Item>
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
                  <Box visibleFrom="sm">
                  <Tabs value={activeTab} onChange={handleTabChange} radius="md">
                    <Tabs.List>
                      {navigationSection === 'features' && isUserLoggedIn && (
                        <>
                          <Tabs.Tab
                            value="agreement"
                            c={activeTab === 'agreement' ? theme.white : undefined}
                            fw={activeTab === 'agreement' ? 700 : undefined}
                          >
                            Điều lệ
                          </Tabs.Tab>
                          {isPartner && (
                            <Tabs.Tab
                              value="partner"
                              c={activeTab === 'partner' ? theme.white : undefined}
                              fw={activeTab === 'partner' ? 700 : undefined}
                            >
                              Đối tác
                            </Tabs.Tab>
                          )}
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
                  </Box>
                )}
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
            {navigationSection === 'library' && activeTab === 'manage-accounts' && (
              <ScrollArea h="100%" type="auto" offsetScrollbars>
                <Stack gap="xs">
                  <NavLink
                    label="Quản lý bản quyền"
                    leftSection={<Shield size={16} color="#FFB81C" />}
                    active={manageAccountsSection === 'license'}
                    fw={manageAccountsSection === 'license' ? 700 : undefined}
                    onClick={() => setManageAccountsSection('license')}
                    color="yellow"
                  />
                  <NavLink
                    label="Lấy bot"
                    leftSection={<Download size={16} color="#FFB81C" />}
                    active={manageAccountsSection === 'get-bot'}
                    fw={manageAccountsSection === 'get-bot' ? 700 : undefined}
                    onClick={() => setManageAccountsSection('get-bot')}
                    color="yellow"
                  />
                </Stack>
              </ScrollArea>
            )}
          </AppShell.Navbar>

          <AppShell.Main style={{
            backgroundColor: '#000000',
            ...(activeTab === 'agreement' && {
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
                  <Tabs.Panel value="agreement">
                    <PartnerAgreement
                      onAccept={() => {}}
                      selectedPlatform={selectedPlatform}
                      onPlatformSelect={setSelectedPlatform}
                      userId={loggedInUserId || ''}
                      isPartner={!!isPartner}
                      partnerStatus={partnerStatus}
                      tokenExpiresAt={tokenExpiresAt}
                      onRegistrationSuccess={() => {
                        // Rank is no longer assigned at registration — it is assigned only
                        // when the partner confirms the agreement email. Just mark the
                        // account as pending so the UI shows the correct inactive state.
                        setPartnerStatus('inactive');
                      }}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="partner">
                    {partnerStatus === 'inactive' ? (
                      <div className={classes.inactivePartnerPanel}>
                        <div className={classes.inactivePartnerIcon}>✉️</div>
                        <h3 className={classes.inactivePartnerTitle}>
                          Xác nhận email để truy cập
                        </h3>
                        <p className={classes.inactivePartnerText}>
                          Tài khoản đối tác của bạn đang chờ xác nhận. Vui lòng kiểm tra email và nhấn nút
                          <strong>&nbsp;&ldquo;Tôi đã đọc và xác nhận&rdquo;&nbsp;</strong>
                          trong thư Hợp Đồng Đối Tác để kích hoạt tài khoản.
                        </p>
                        <p className={classes.inactivePartnerHint}>
                          Sau khi xác nhận, hãy tải lại trang để truy cập giao diện Đối Tác.
                        </p>
                      </div>
                    ) : (
                      <PartnerApp
                        onAsideContentChange={setPartnerAside}
                        selectedPlatform={selectedPlatform}
                        onPlatformSelect={setSelectedPlatform}
                        isAuthenticated={isPartnerAuthenticated}
                        setIsAuthenticated={setIsPartnerAuthenticated}
                        loadingPlatforms={loadingPlatforms}
                      />
                    )}
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
                        <GetBotTab isActive={activeTab === 'get-bot'} onAsideContentChange={setGetBotAside} />
                      </Tabs.Panel>
                      <Tabs.Panel value="manage-accounts">
                        <ManageAccountsTab
                          isActive={activeTab === 'manage-accounts'}
                          activeSection={manageAccountsSection}
                          onAsideContentChange={setManageAccountsAside}
                        />
                      </Tabs.Panel>
                    </>
                  )}
                </>
              )}

              {/* Login Section */}
              {navigationSection === 'login' && (
                <LoginTab
                  onLoginSuccess={(userId, _partnerRank, ownReferralId) => {
                    // Update parent state
                    setIsUserLoggedIn(true);
                    setLoggedInUserId(userId);
                    // The login API returns ownReferralId (not partnerRank) to indicate partner status
                    setIsActivePartner(!!ownReferralId);
                    // Set referral ID if provided
                    if (ownReferralId) {
                      setReferralId(ownReferralId);
                      localStorage.setItem('referralId', ownReferralId);
                      sessionStorage.setItem('referralId', ownReferralId);
                    }
                    // Fetch full partner status (including partnerStatus) from the server
                    checkPartnerRank(userId);
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

              {/* Reward System Section */}
              {navigationSection === 'reward' && isUserLoggedIn && (
                <Tabs.Panel value="reward">
                  <RewardSystemTab />
                </Tabs.Panel>
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
            {navigationSection === 'library' && activeTab === 'get-bot' && (
              getBotAside
            )}
            {navigationSection === 'library' && activeTab === 'manage-accounts' && (
              manageAccountsAside
            )}
          </AppShell.Aside>

          <AppShell.Footer style={{
            backgroundColor: 'color-mix(in srgb, var(--mantine-color-body), transparent 15%)',
            backdropFilter: 'blur(5px)',
          }}>
            <Box visibleFrom="sm" h="100%">
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
            </Box>
          </AppShell.Footer>

          {/* Floating action button for Navbar panel */}
          <Affix position={{ bottom: 80, left: 20 }} hiddenFrom="sm">
            <Transition transition="slide-up" mounted={shouldShowNavbar}>
              {(transitionStyles) => (
                <ActionIcon
                  size="xl"
                  radius="xl"
                  variant="filled"
                  color={theme.colors.accent[6]}
                  onClick={toggleMobileNavbar}
                  style={{
                    ...transitionStyles,
                    boxShadow: theme.shadows.lg,
                    width: 56,
                    height: 56,
                  }}
                  aria-label="Toggle navigation sidebar"
                >
                  <PanelLeft size={24} />
                </ActionIcon>
              )}
            </Transition>
          </Affix>

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

        {/* Mobile Navigation Drawer */}
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
          size={300}
          position="left"
          title={
            <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => { closeDrawer(); handleLogoClick(); }}>
              <Image src="/vnclc-logo.png" alt="VNCLC Logo" width={72} height={16} priority />
            </Group>
          }
          overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        >
          <Stack style={{ height: 'calc(100dvh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {/* Referral ID at top */}
            {isUserLoggedIn && (
              <Stack gap="sm" mb="md">
                {!isActivePartner && (
                  <Badge
                    variant="outline"
                    color="gray"
                    size="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => { handleNavigationChange('features'); setActiveTab('agreement'); closeDrawer(); }}
                  >
                    Chưa là đối tác
                  </Badge>
                )}
                {isActivePartner && (
                  <Badge
                    size="lg"
                    className={classes.partnerBadge}
                    onClick={() => { handleNavigationChange('features'); setActiveTab('partner'); closeDrawer(); }}
                  >
                    Đối tác Tradi
                  </Badge>
                )}
                <Group
                  gap="xs"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 184, 28, 0.1)',
                    border: '1px solid rgba(255, 184, 28, 0.3)',
                  }}
                >
                  <Text size="sm" fw={600} c="yellow">Mã giới thiệu:</Text>
                  <Text size="sm" fw={600} c="white" style={{ fontFamily: 'monospace' }}>{referralId || 'N/A'}</Text>
                  {referralId && (
                    <CopyButton value={referralId} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Đã sao chép!' : 'Sao chép'} withArrow position="right">
                          <ActionIcon color={copied ? 'teal' : 'yellow'} variant="subtle" onClick={copy} size="sm">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  )}
                </Group>
              </Stack>
            )}

            {/* Scrollable navigation links */}
            <ScrollArea style={{ flex: 1 }}>
              <Stack gap={4}>
                {/* Đối tác Tradi parent navlink */}
                {isUserLoggedIn && (
                  <NavLink
                    label="Đối tác Tradi"
                    leftSection={<Users size={16} />}
                    defaultOpened={navigationSection === 'features'}
                    active={navigationSection === 'features'}
                    color="yellow"
                  >
                    <NavLink
                      label="Điều lệ"
                      leftSection={<Library size={16} />}
                      active={navigationSection === 'features' && activeTab === 'agreement'}
                      onClick={() => { handleNavigationChange('features'); setActiveTab('agreement'); closeDrawer(); }}
                      color="yellow"
                    />
                    {isPartner && (
                      <NavLink
                        label="Đối tác"
                        leftSection={<TrendingUp size={16} />}
                        active={navigationSection === 'features' && activeTab === 'partner'}
                        onClick={() => { handleNavigationChange('features'); closeDrawer(); }}
                        color="yellow"
                      />
                    )}
                  </NavLink>
                )}

                {/* Cá nhân parent navlink */}
                <NavLink
                  label="Cá nhân"
                  leftSection={<User size={16} />}
                  defaultOpened={navigationSection === 'library'}
                  active={navigationSection === 'library'}
                  color="blue"
                >
                  <NavLink
                    label="Hướng dẫn"
                    leftSection={<BookOpen size={16} />}
                    active={navigationSection === 'library' && activeTab === 'guides'}
                    onClick={() => { handleNavigationChange('library'); setActiveTab('guides'); setSelectedArticle('guide-1'); closeDrawer(); }}
                    color="blue"
                  />
                  <NavLink
                    label="Chiến lược"
                    leftSection={<TrendingUp size={16} />}
                    active={navigationSection === 'library' && activeTab === 'strategies'}
                    onClick={() => { handleNavigationChange('library'); setActiveTab('strategies'); setSelectedArticle('strategy-1'); closeDrawer(); }}
                    color="blue"
                  />
                  {isUserLoggedIn && (
                    <>
                      <NavLink
                        label="Lấy Bot"
                        leftSection={<Bot size={16} />}
                        active={navigationSection === 'library' && activeTab === 'get-bot'}
                        onClick={() => { handleNavigationChange('library'); setActiveTab('get-bot'); closeDrawer(); }}
                        color="blue"
                      />
                      <NavLink
                        label="Bản quyền"
                        leftSection={<Shield size={16} />}
                        active={navigationSection === 'library' && activeTab === 'manage-accounts'}
                        onClick={() => { handleNavigationChange('library'); setActiveTab('manage-accounts'); closeDrawer(); }}
                        color="blue"
                      />
                    </>
                  )}
                </NavLink>
              </Stack>
              {/* Reward System mobile nav */}
              {isUserLoggedIn && (
                <NavLink
                  label="Hệ Thống Thưởng"
                  leftSection={<Gift size={16} color="#c77dff" />}
                  active={navigationSection === 'reward'}
                  fw={navigationSection === 'reward' ? 700 : undefined}
                  onClick={() => { handleNavigationChange('reward'); closeDrawer(); }}
                  color="grape"
                />
              )}
            </ScrollArea>

            {/* Footer info at bottom of drawer */}
            <Box mt="auto">
              <Divider my="sm" />
              <Stack gap="xs" pb="xs">
                <Group gap="xs" align="center">
                  <Image src="/tradi-logo.png" alt="Tradi Logo" width={24} height={24} style={{ objectFit: 'contain' }} />
                  <Text size="xs" c="dimmed">© {new Date().getFullYear()} Tradi. Bảo lưu mọi quyền.</Text>
                </Group>
              </Stack>
            </Box>
          </Stack>
        </Drawer>

        {/* Congratulations Modal */}
        <CongratulationsModal
          isOpen={showCongratulations}
          onClose={() => {
            setShowCongratulations(false);
            // Mark as seen in the database
            if (loggedInUserId) {
              fetch('/api/mark-congrats-shown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnerId: loggedInUserId }),
              }).catch(() => {}); // fire-and-forget
            }
            // Switch to partner tab after closing modal
            setActiveTab('partner');
            // Refresh partner data
            if (loggedInUserId) {
              checkPartnerRank(loggedInUserId);
            }
          }}
          onNavigateToLogin={() => {
            // This is called when user clicks continue on stage 1
            // We don't navigate yet, just move to stage 2 of the modal
          }}
        />
      </div>
    </>
  );
}
