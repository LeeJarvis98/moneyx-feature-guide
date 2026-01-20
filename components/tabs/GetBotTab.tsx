'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Box,
  Stepper,
  Group,
  Button,
  Title,
  Text,
  Stack,
  TextInput,
  Select,
  Paper,
  Image,
  Container,
  Alert,
  Grid,
  Card,
  Badge,
  ActionIcon,
  Modal,
  Table,
  Checkbox,
  Accordion,
} from '@mantine/core';
import { Download, CheckCircle, AlertCircle, Play, ExternalLink, Video } from 'lucide-react';
import classes from './GetBotTab.module.css';

type AccountStatus = 'idle' | 'checking' | 'authorized' | 'unauthorized';

interface AccountRow {
  id: string;
  status: 'licensed' | 'unlicensed';
}

export function GetBotTab() {
  const pathname = usePathname();
  // Extract partner ID from pathname (e.g., /mra -> mra)
  const partnerId = pathname.startsWith('/') && pathname !== '/' ? pathname.slice(1).split('/')[0] : null;
  
  const [active, setActive] = useState(0);
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('idle');
  const [accountData, setAccountData] = useState<{
    affiliation: boolean;
    accounts: string[];
    client_uid: string;
  } | null>(null);
  const [accountRows, setAccountRows] = useState<AccountRow[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [grantingLicense, setGrantingLicense] = useState(false);
  const [userTypeModalOpen, setUserTypeModalOpen] = useState(false);
  const [partnerPlatformUrls, setPartnerPlatformUrls] = useState<Record<string, string>>({});

  // Load partner platform data on mount
  useEffect(() => {
    const loadPartnerData = () => {
      try {
        const storedData = sessionStorage.getItem('partnerPlatformData');
        if (storedData) {
          const platformData = JSON.parse(storedData);
          if (platformData.platformRefLinks && Array.isArray(platformData.platformRefLinks)) {
            const urlMap: Record<string, string> = {};
            platformData.platformRefLinks.forEach((link: string) => {
              // Split only on the first colon to handle URLs with colons (https://)
              const colonIndex = link.indexOf(':');
              if (colonIndex > -1) {
                const platform = link.substring(0, colonIndex).trim();
                const url = link.substring(colonIndex + 1).trim();
                if (platform && url) {
                  urlMap[platform.toLowerCase()] = url;
                }
              }
            });
            setPartnerPlatformUrls(urlMap);
            console.log('[GetBotTab] Loaded partner platform URLs:', urlMap);
          }
        }
      } catch (error) {
        console.error('[GetBotTab] Error loading partner platform data:', error);
      }
    };

    loadPartnerData();
  }, []);

  // Function to check account status via API
  const checkAccountStatus = async () => {
    setAccountStatus('checking');
    setErrorMessage('');
    setAccountData(null);
    setAccountRows([]);
    setSelectedAccounts([]);

    try {
      // Step 1: Authenticate with platform if needed
      const partnerDataStr = sessionStorage.getItem('partnerPlatformData');
      let platformAuth = null;
      
      if (partnerDataStr && selectedPlatform) {
        try {
          const platformData = JSON.parse(partnerDataStr);
          
          // Find platform credentials
          if (platformData.platformAccounts && Array.isArray(platformData.platformAccounts)) {
            const accountEntry = platformData.platformAccounts.find((acc: string) => 
              acc.toLowerCase().startsWith(selectedPlatform.toLowerCase())
            );
            
            if (accountEntry) {
              // Parse account entry: "exness: email@example.com/password"
              // Split only on the first colon to avoid issues with colons in passwords
              const colonIndex = accountEntry.indexOf(':');
              if (colonIndex > -1) {
                const credentials = accountEntry.substring(colonIndex + 1).trim();
                if (credentials) {
                  const [login, password] = credentials.split('/');
                  
                  if (login && password && login !== 'null' && password !== 'null') {
                    // Attempt platform authentication
                    console.log('[GetBotTab] Authenticating with platform:', selectedPlatform);
                    
                    const authResponse = await fetch('/api/partner-login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        partnerId: login,
                        password: password,
                        platform: selectedPlatform,
                      }),
                    });

                    if (authResponse.ok) {
                      const authData = await authResponse.json();
                      platformAuth = {
                        token: authData.platformToken,
                        platform: selectedPlatform,
                      };
                      console.log('[GetBotTab] Platform authentication successful');
                    }
                  }
                }
              }
            }
          }
        } catch (authError) {
          console.error('[GetBotTab] Platform authentication error:', authError);
          // Continue without auth if it fails
        }
      }

      // Step 2: Check email status
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add partner ID header if we're on a partner route
      if (partnerId) {
        headers['x-partner-id'] = partnerId;
      }
      
      // Add platform auth token if available
      if (platformAuth && platformAuth.token) {
        headers['x-platform-token'] = platformAuth.token;
      }

      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();

      if (result.success && result.data.affiliation) {
        setAccountData(result.data);
        // Use accountsWithStatus if available (from Google Sheets check), otherwise use default status
        const rows: AccountRow[] = result.data.accountsWithStatus 
          ? result.data.accountsWithStatus 
          : result.data.accounts.map((accountId: string) => ({
              id: accountId,
              status: 'unlicensed' as const,
            }));
        setAccountRows(rows);
        
        // Auto-select accounts that are already licensed (exist in Google Sheets)
        const licensedAccounts = rows
          .filter((row) => row.status === 'licensed')
          .map((row) => row.id);
        setSelectedAccounts(licensedAccounts.slice(0, 3)); // Limit to max 3
        
        setAccountStatus('authorized');
      } else {
        setAccountStatus('unauthorized');
        setErrorMessage('Email không tồn tại trong hệ thống hoặc chưa được liên kết với sàn ' + (tradingPlatforms.find((p) => p.value === selectedPlatform)?.label || ''));
      }
    } catch (error) {
      setAccountStatus('unauthorized');
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      console.error('API Error:', error);
    }
  };

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts((prev) => {
      if (prev.includes(accountId)) {
        // If already selected, remove it
        return prev.filter((id) => id !== accountId);
      } else {
        // Only add if we haven't reached the limit of 3
        if (prev.length < 3) {
          return [...prev, accountId];
        }
        return prev;
      }
    });
  };

  const toggleAllAccounts = () => {
    if (selectedAccounts.length > 0) {
      setSelectedAccounts([]);
    } else {
      // Select up to 3 accounts
      setSelectedAccounts(accountRows.slice(0, 3).map((row) => row.id));
    }
  };

  const handleDownloadBot = async () => {
    try {
      const botUrl = '/api/download-bot';
      
      // Try to open the file directly (will trigger MT5 if installed)
      const link = document.createElement('a');
      link.href = botUrl;
      link.target = '_blank';
      
      // Try to open in new tab first
      const opened = window.open(botUrl, '_blank');
      
      // If popup was blocked or failed to open, fallback to download
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        // Fallback: trigger download
        link.download = 'VNCLC [v1.3].ex5';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading bot:', error);
      alert('Không thể tải bot. Vui lòng thử lại sau.');
    }
  };

  // Grant license for newly selected unlicensed accounts
  const grantLicense = async () => {
    // Filter only unlicensed accounts that are selected
    const unlicensedIds = selectedAccounts.filter((id) => {
      const row = accountRows.find((r) => r.id === id);
      return row && row.status === 'unlicensed';
    });

    if (unlicensedIds.length === 0) {
      // All selected accounts are already licensed, just proceed to next step
      setActive((current) => (current < 2 ? current + 1 : current));
      return;
    }

    setGrantingLicense(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add partner ID header if we're on a partner route
      if (partnerId) {
        headers['x-partner-id'] = partnerId;
      }

      const response = await fetch('/api/grant-license', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          accountIds: unlicensedIds,
          email: email, // Send email along with account IDs
          clientUid: accountData?.client_uid // Send client UID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grant license');
      }

      const result = await response.json();

      if (result.success) {
        // Update account rows to mark newly licensed accounts
        setAccountRows((prev) =>
          prev.map((row) =>
            unlicensedIds.includes(row.id) ? { ...row, status: 'licensed' } : row
          )
        );
        
        // Proceed to next step
        setActive((current) => (current < 2 ? current + 1 : current));
      } else {
        alert('Không thể cấp bản quyền. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Grant license error:', error);
      alert('Lỗi khi cấp bản quyền. Vui lòng thử lại.');
    } finally {
      setGrantingLicense(false);
    }
  };

  const nextStep = () => setActive((current) => (current < 2 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  // Sample guide media (replace with actual media URLs)
  const guideVideos = [
    { id: 1, title: 'Video hướng dẫn đăng ký tài khoản', thumbnail: '/hero_section/carousel/1.png', url: 'https://example.com/video1' },
    { id: 2, title: 'Video xác minh tài khoản', thumbnail: '/hero_section/carousel/2.png', url: 'https://example.com/video2' },
  ];

  const guideImages = [
    { id: 1, title: 'Màn hình đăng ký', src: '/hero_section/carousel/3.png' },
    { id: 2, title: 'Bước xác minh', src: '/hero_section/carousel/4.png' },
    { id: 3, title: 'Hoàn tất đăng ký', src: '/hero_section/carousel/5.png' },
  ];

  const tradingPlatforms = [
    {
      value: 'exness',
      label: 'Exness',
      disabled: false,
      image: '/getbot_section/exness.png',
      tutorialVideo: 'https://youtu.be/uAdKY9uNtIo?si=RgHExJAThIP4g7d4',
      platformUrl: partnerPlatformUrls['exness'] || 'https://one.exnessonelink.com/a/ojl5148a7y',
      feature: 'Hoàn phí $10/lot'
    },
    {
      value: 'binance',
      label: 'Binance',
      disabled: false,
      image: '/getbot_section/binance.png',
      tutorialVideo: 'https://youtu.be/WkYlawXn9HE?si=E7ej1Td9Q2IKql4l',
      platformUrl: partnerPlatformUrls['binance'] || 'https://www.binance.com/',
      feature: ''
    },
    {
      value: 'bingx',
      label: 'BingX',
      disabled: true,
      image: '/getbot_section/bingx.png',
      tutorialVideo: 'https://example.com/bingx-tutorial',
      platformUrl: partnerPlatformUrls['bingx'] || 'https://bingx.com/',
      feature: ''
    },
    {
      value: 'bitget',
      label: 'BitGet',
      disabled: true,
      image: '/getbot_section/bitget.png',
      tutorialVideo: 'https://example.com/bitget-tutorial',
      platformUrl: partnerPlatformUrls['bitget'] || 'https://www.bitget.com/',
      feature: ''
    },
    {
      value: 'bybit',
      label: 'Bybit',
      disabled: true,
      image: '/getbot_section/bybit.png',
      tutorialVideo: 'https://example.com/bybit-tutorial',
      platformUrl: partnerPlatformUrls['bybit'] || 'https://www.bybit.com/',
      feature: ''
    },
    {
      value: 'gate',
      label: 'Gate.io',
      disabled: true,
      image: '/getbot_section/gate.png',
      tutorialVideo: 'https://example.com/gate-tutorial',
      platformUrl: partnerPlatformUrls['gate'] || 'https://www.gate.io/',
      feature: ''
    },
    {
      value: 'mexc',
      label: 'MEXC',
      disabled: true,
      image: '/getbot_section/mexc.png',
      tutorialVideo: 'https://example.com/mexc-tutorial',
      platformUrl: partnerPlatformUrls['mexc'] || 'https://www.mexc.com/',
      feature: ''
    },
    {
      value: 'okx',
      label: 'OKX',
      disabled: true,
      image: '/getbot_section/okx.png',
      tutorialVideo: 'https://example.com/okx-tutorial',
      platformUrl: partnerPlatformUrls['okx'] || 'https://www.okx.com/',
      feature: ''
    },
    {
      value: 'vantage',
      label: 'Vantage',
      disabled: true,
      image: '/getbot_section/vantage.png',
      tutorialVideo: 'https://example.com/vantage-tutorial',
      platformUrl: partnerPlatformUrls['vantage'] || 'https://www.vantagemarkets.com/',
      feature: ''
    },
    {
      value: 'xm',
      label: 'XM',
      disabled: true,
      image: '/getbot_section/xm.png',
      tutorialVideo: 'https://example.com/xm-tutorial',
      platformUrl: partnerPlatformUrls['xm'] || 'https://www.xm.com/',
      feature: ''
    },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Stepper active={active} onStepClick={setActive}>
          {/* Step 1: Chọn sàn giao dịch & Hướng dẫn */}
          <Stepper.Step
            label="Bước 1"
            description="Chọn sàn & Hướng dẫn"
            allowStepSelect={true}
          >
            <Paper shadow="sm" p="xl" radius="md" mt="xl">
              <Stack gap="xl">
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Title order={3} mb="md">
                      Chọn sàn giao dịch của bạn
                    </Title>
                    <Text c="dimmed">
                      Vui lòng chọn sàn giao dịch bạn đang sử dụng hoặc muốn sử dụng. Hướng dẫn sẽ hiển thị bên dưới.
                    </Text>
                  </Box>
                  <Button
                    c="black"
                    onClick={() => setUserTypeModalOpen(true)}
                    size="lg"
                    disabled={!selectedPlatform}
                    className={classes.glowButton}
                  >
                    Tiếp theo
                  </Button>
                </Group>

                <Grid gutter="md" justify="center">
                  {tradingPlatforms.map((platformOption) => (
                    <Grid.Col key={platformOption.value} span={{ base: 12, sm: 6, md: 2.4 }}>
                      <Paper
                        shadow="md"
                        p="xl"
                        radius="md"
                        className={`${classes.platformCard} ${platformOption.disabled ? classes.cardDisabled : ''
                          } ${selectedPlatform === platformOption.value ? classes.selectedCard : ''
                          }`}
                        style={{
                          backgroundImage: `url(${platformOption.image})`,
                          cursor: platformOption.disabled ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => {
                          if (!platformOption.disabled) {
                            setSelectedPlatform(platformOption.value);
                            setPlatform(platformOption.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!platformOption.disabled && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            setSelectedPlatform(platformOption.value);
                            setPlatform(platformOption.value);
                          }
                        }}
                        onMouseEnter={() => !platformOption.disabled && setHoveredPlatform(platformOption.value)}
                        onMouseLeave={() => setHoveredPlatform(null)}
                        tabIndex={platformOption.disabled ? -1 : 0}
                        role="button"
                        aria-label={`Select ${platformOption.label} trading platform`}
                        aria-disabled={platformOption.disabled}
                      >
                        <div className={classes.cardContent} style={{ marginTop: '-20px' }}>
                          <Title order={6} className={classes.platformTitle}>
                            {platformOption.label}
                          </Title>
                          {platformOption.feature && (
                            <Badge
                              size="sm"
                              variant="filled"
                              color="#FFB81C"
                              style={{
                                marginTop: '4px',
                                color: 'black',
                              }}
                            >
                              {platformOption.feature}
                            </Badge>
                          )}
                        </div>
                      </Paper>
                    </Grid.Col>
                  ))}
                </Grid>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 2: Kiểm tra Email */}
          <Stepper.Step
            label="Bước 2"
            description="Kiểm tra Email"
            allowStepSelect={accountStatus === 'authorized'}
          >
            <Paper shadow="sm" p="xl" radius="md" mt="xl">
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Title order={3} mb="md">
                      Xác thực Email của bạn
                    </Title>
                    <Text c="dimmed" mb="lg">
                      Nhập email đã đăng ký với <strong style={{ color: '#FFB81C' }}>{tradingPlatforms.find((p) => p.value === selectedPlatform)?.label}</strong> để kiểm tra tình trạng cùng hệ thống
                    </Text>
                  </Box>

                  <Stack style={{ flex: 1 }} gap="md">
                    <Group align="flex-end" gap="md">
                      <TextInput
                        type="email"
                        placeholder="client@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.currentTarget.value)}
                        size="md"
                        required
                        classNames={{ input: classes.glowInput }}
                        style={{ flex: 1 }}
                      />
                      <Button
                        c="black"
                        onClick={checkAccountStatus}
                        loading={accountStatus === 'checking'}
                        disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                        size="md"
                        className={classes.glowButton}
                      >
                        Kiểm tra
                      </Button>
                    </Group>

                    {accountStatus === 'unauthorized' && (
                      <Alert
                        icon={<AlertCircle size={20} />}
                        title="Xác thực thất bại"
                        color="red"
                        radius="md"
                      >
                        {errorMessage || 'Không thể xác thực email. Vui lòng kiểm tra lại email và sàn giao dịch.'}
                      </Alert>
                    )}

                    {accountStatus === 'authorized' && accountData && (
                      <Alert
                        icon={<CheckCircle size={20} />}
                        title="Xác thực thành công!"
                        color="green"
                        radius="md"
                      >
                        <Text size="sm">
                          <strong>Client UID:</strong> {accountData.client_uid}
                        </Text>
                      </Alert>
                    )}
                  </Stack>
                </Group>

                {accountStatus === 'authorized' && accountData && (
                  <>
                    <Box>
                      <Text size="sm" fw={600} mb="xs">
                        Danh sách tài khoản cần cấp bản quyền Bot (nhấn để chọn):
                      </Text>
                      
                      {/* Legend */}
                      <Group gap="xl" mb="sm">
                        <Group gap="xs">
                          <Box
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: 'var(--mantine-color-violet-6)',
                            }}
                          />
                          <Text size="sm" c="dimmed">
                            ID đã cấp bản quyền (không thể thay đổi)
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Box
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: '#FFB81C',
                            }}
                          />
                          <Text size="sm" c="dimmed">
                            ID được chọn
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Box
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: '2px solid var(--mantine-color-gray-5)',
                              backgroundColor: 'transparent',
                            }}
                          />
                          <Text size="sm" c="dimmed">
                            ID khả dụng (chưa chọn)
                          </Text>
                        </Group>
                      </Group>

                      <Paper
                        withBorder
                        p="md"
                        radius="md"
                        style={{
                          backgroundColor: 'var(--mantine-color-dark-7)',
                        }}
                      >
                        <Group gap="xs">
                          {accountRows.map((row) => {
                            const isLicensed = row.status === 'licensed';
                            const isSelected = selectedAccounts.includes(row.id);
                            
                            return (
                              <Badge
                                key={row.id}
                                size="lg"
                                variant={isSelected ? 'filled' : 'outline'}
                                color={isLicensed ? 'violet' : (isSelected ? '#FFB81C' : 'gray')}
                                style={{
                                  cursor: isLicensed ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s ease',
                                  padding: '10px 16px',
                                  fontSize: '16px',
                                  color: isSelected && !isLicensed ? 'black' : undefined,
                                  opacity: isLicensed ? 0.9 : 1,
                                }}
                                onClick={() => !isLicensed && toggleAccountSelection(row.id)}
                              >
                                {row.id}
                              </Badge>
                            );
                          })}
                        </Group>
                      </Paper>
                      {selectedAccounts.length > 0 && (
                        <Text size="sm" c="dimmed" mt="xs">
                          Mỗi email chỉ được sử dụng tối đa <strong style={{ color: '#FFB81C' }}>{selectedAccounts.length}/3</strong> ID để cấp bản quyền Bot.
                        </Text>
                      )}
                    </Box>
                  </>
                )}



                <Group justify="space-between" mt="xl">
                  <Button variant="default" onClick={prevStep} size="lg" className={classes.glowButton}>
                    Quay lại
                  </Button>
                  <Group gap="md" align="center">
                    {accountStatus === 'authorized' && accountData && (
                      <Text size="sm" c="dimmed">
                        Bạn có thể tiếp tục sang bước tiếp theo để tải bot.
                      </Text>
                    )}

                    <Button
                      c="black"
                      onClick={grantLicense}
                      loading={grantingLicense}
                      disabled={
                        accountStatus !== 'authorized' || 
                        selectedAccounts.filter(id => {
                          const row = accountRows.find(r => r.id === id);
                          return row && row.status === 'unlicensed';
                        }).length === 0
                      }
                      size="lg"
                      className={classes.glowButton}
                    >
                      Cấp bản quyền
                    </Button>
                  </Group>
                </Group>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 3: Lấy file Bot */}
          <Stepper.Step
            label="Bước 3"
            description="Tải Bot"
            allowStepSelect={accountStatus === 'authorized'}
          >
            <Paper shadow="sm" p="xl" radius="md" mt="xl">
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Stack gap="xl">
                    <Box>
                      <Badge size="xl" variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 105 }} mb="md">
                        Hoàn tất
                      </Badge>
                      <Title order={3} mb="md">
                        Tải Bot xuống
                      </Title>
                      <Text size="sm">
                        <strong>Lưu ý:</strong> Sau khi tải xuống, vui lòng làm theo hướng dẫn
                        bên phải.
                      </Text>
                    </Box>

                    <Paper withBorder p="xl" radius="md">
                      <Stack gap="md" align="center">
                        <Box
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: 'var(--mantine-color-teal-1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Download size={40} color="var(--mantine-color-teal-7)" />
                        </Box>

                        <Text size="lg" fw={500}>
                          VNCLC Trading Bot v1.0
                        </Text>

                        <Button
                          c="black"
                          size="lg"
                          leftSection={<Download size={20} />}
                          onClick={handleDownloadBot}
                          fullWidth
                          mt="md"
                          className={classes.glowButton}
                        >
                          Tải Bot
                        </Button>
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 9 }}>
                  <Paper withBorder radius="md" style={{ overflow: 'hidden', height: '100%', minHeight: 400 }}>
                    <iframe
                      src="https://drive.google.com/file/d/1ekRrm-JRk-dmMsINBCp3ZiCWStsVxZpM/preview"
                      style={{ width: '100%', height: '100%', minHeight: 400, border: 'none' }}
                      allow="autoplay"
                      title="Video hướng dẫn tải Bot"
                      aria-label="Tutorial video for downloading the bot"
                    />
                  </Paper>
                </Grid.Col>
              </Grid>

              <Group justify="space-between" mt="xl">
                <Button variant="default" onClick={prevStep} size="lg" className={classes.glowButton}>
                  Quay lại
                </Button>
                <Button
                  variant="light"
                  onClick={() => setActive(0)}
                  size="lg"
                  className={classes.glowButton}
                >
                  Bắt đầu lại
                </Button>
              </Group>
            </Paper>
          </Stepper.Step>
        </Stepper>
      </Stack>

      {/* User Type Selection Modal */}
      <Modal
        opened={userTypeModalOpen}
        onClose={() => setUserTypeModalOpen(false)}
        size="lg"
        title="Chọn tình trạng tài khoản của bạn"
        centered
      >
        <Accordion
          variant="contained"
          chevronPosition="left"
          styles={{
            chevron: { display: 'none' },
            control: { padding: '10px' },
            item: { marginBottom: '0px' },
          }}
        >

          <Accordion.Item value="no-account">
            <Accordion.Control>
              <Text fw={600} size="lg">Chưa có tài khoản</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Bạn chưa có tài khoản trên sàn <strong style={{ color: '#FFB81C' }}>{tradingPlatforms.find((p) => p.value === selectedPlatform)?.label}</strong>?
                  Thực hiện các bước dưới đây.
                </Text>
                <Group grow>
                  <Button
                    component="a"
                    href={tradingPlatforms.find((p) => p.value === selectedPlatform)?.platformUrl}
                    target="_blank"
                    size="md"
                    leftSection={<ExternalLink size={18} />}
                    className={classes.glowButton}
                    c="black"
                  >
                    Đăng ký tài khoản
                  </Button>
                  <Button
                    component="a"
                    href={tradingPlatforms.find((p) => p.value === selectedPlatform)?.tutorialVideo}
                    target="_blank"
                    size="md"
                    variant="outline"
                    leftSection={<Video size={18} />}
                  >
                    Hướng dẫn đăng ký
                  </Button>
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="has-account">
            <Accordion.Control>
              <Text fw={600} size="lg">Đã có tài khoản</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Nếu đã có sẵn tài khoản tại <strong style={{ color: '#FFB81C' }}>{tradingPlatforms.find((p) => p.value === selectedPlatform)?.label}</strong>.
                  Vui lòng <strong style={{ color: '#FFB81C' }}>nhắn support chuyển link</strong> sang hệ thống Tradi để tiến hành cấp bản quyền.
                </Text>
                <Group grow>
                  <Button
                    component="a"
                    href="https://zalo.me/0353522252/"
                    target="_blank"
                    size="md"
                    variant="outline"
                    color="orange"
                    leftSection={<ExternalLink size={18} />}
                  >
                    Chưa trong hệ thống
                  </Button>
                  <Button
                    size="md"
                    c="black"
                    leftSection={<CheckCircle size={18} />}
                    className={classes.glowButton}
                    onClick={() => {
                      setUserTypeModalOpen(false);
                      nextStep();
                    }}
                  >
                    Đã trong hệ thống Tradi
                  </Button>
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Modal>

      {/* Video Modal */}
      <Modal
        opened={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        size="xl"
        title="Video hướng dẫn"
        centered
      >
        <Box>
          <Text c="dimmed" mb="md">
            Video URL: {selectedVideo}
          </Text>
          <Paper withBorder p="xl" style={{ minHeight: 400 }}>
            <Text ta="center" c="dimmed">
              Video player sẽ được tích hợp ở đây.
              <br />
              Bạn có thể sử dụng thư viện như react-player hoặc nhúng iframe YouTube/Vimeo.
            </Text>
          </Paper>
        </Box>
      </Modal>
    </Container>
  );
}