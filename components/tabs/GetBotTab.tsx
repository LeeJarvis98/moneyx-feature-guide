'use client';

import { useState } from 'react';
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
  Tabs,
} from '@mantine/core';
import { Download, CheckCircle, AlertCircle, Play, ExternalLink, Video, Mail, Phone } from 'lucide-react';
import classes from './GetBotTab.module.css';

type AccountStatus = 'idle' | 'checking' | 'authorized' | 'unauthorized';

interface AccountRow {
  id: string;
  status: 'licensed' | 'unlicensed';
}

export function GetBotTab() {
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
  const [activeTab, setActiveTab] = useState<string | null>('no-account');

  // Function to check account status via API
  const checkAccountStatus = async () => {
    setAccountStatus('checking');
    setErrorMessage('');
    setAccountData(null);
    setAccountRows([]);
    setSelectedAccounts([]);

    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  const handleDownloadBot = () => {
    // This will be replaced with actual download logic
    alert('Bot file download will be implemented here. Please provide the bot file.');
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
      const response = await fetch('/api/grant-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountIds: unlicensedIds }),
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
      platformUrl: 'https://one.exnessonelink.com/a/ojl5148a7y',
      feature: 'Hoàn phí $10/lot'
    },
    {
      value: 'binance',
      label: 'Binance',
      disabled: false,
      image: '/getbot_section/binance.png',
      tutorialVideo: 'https://youtu.be/WkYlawXn9HE?si=E7ej1Td9Q2IKql4l',
      platformUrl: 'https://www.binance.com/',
      feature: ''
    },
    {
      value: 'bingx',
      label: 'BingX',
      disabled: true,
      image: '/getbot_section/bingx.png',
      tutorialVideo: 'https://example.com/bingx-tutorial',
      platformUrl: 'https://bingx.com/',
      feature: ''
    },
    {
      value: 'bitget',
      label: 'BitGet',
      disabled: true,
      image: '/getbot_section/bitget.png',
      tutorialVideo: 'https://example.com/bitget-tutorial',
      platformUrl: 'https://www.bitget.com/',
      feature: ''
    },
    {
      value: 'bybit',
      label: 'Bybit',
      disabled: true,
      image: '/getbot_section/bybit.png',
      tutorialVideo: 'https://example.com/bybit-tutorial',
      platformUrl: 'https://www.bybit.com/',
      feature: ''
    },
    {
      value: 'gate',
      label: 'Gate.io',
      disabled: true,
      image: '/getbot_section/gate.png',
      tutorialVideo: 'https://example.com/gate-tutorial',
      platformUrl: 'https://www.gate.io/',
      feature: ''
    },
    {
      value: 'mexc',
      label: 'MEXC',
      disabled: true,
      image: '/getbot_section/mexc.png',
      tutorialVideo: 'https://example.com/mexc-tutorial',
      platformUrl: 'https://www.mexc.com/',
      feature: ''
    },
    {
      value: 'okx',
      label: 'OKX',
      disabled: true,
      image: '/getbot_section/okx.png',
      tutorialVideo: 'https://example.com/okx-tutorial',
      platformUrl: 'https://www.okx.com/',
      feature: ''
    },
    {
      value: 'vantage',
      label: 'Vantage',
      disabled: true,
      image: '/getbot_section/vantage.png',
      tutorialVideo: 'https://example.com/vantage-tutorial',
      platformUrl: 'https://www.vantagemarkets.com/',
      feature: ''
    },
    {
      value: 'xm',
      label: 'XM',
      disabled: true,
      image: '/getbot_section/xm.png',
      tutorialVideo: 'https://example.com/xm-tutorial',
      platformUrl: 'https://www.xm.com/',
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
                        }}
                        onClick={() => {
                          if (!platformOption.disabled) {
                            setSelectedPlatform(platformOption.value);
                            setPlatform(platformOption.value);
                          }
                        }}
                        onMouseEnter={() => !platformOption.disabled && setHoveredPlatform(platformOption.value)}
                        onMouseLeave={() => setHoveredPlatform(null)}
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
        size="xl"
        title="Chọn tình trạng tài khoản của bạn"
        centered
      >
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab value="no-account">
              Chưa có tài khoản
            </Tabs.Tab>
            <Tabs.Tab value="has-account-no-link">
              Đã có tài khoản (chưa liên kết)
            </Tabs.Tab>
            <Tabs.Tab value="has-account-linked">
              Đã có tài khoản (đã liên kết)
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="no-account" pt="xl">
            <Stack gap="xl">
              <Alert color="blue" title="Người dùng chưa có tài khoản">
                <Text size="sm">
                  Bạn chưa có tài khoản trên sàn <strong>{tradingPlatforms.find((p) => p.value === selectedPlatform)?.label}</strong>. 
                  Vui lòng xem video hướng dẫn bên dưới và đăng ký tài khoản để tiếp tục.
                </Text>
              </Alert>

              {selectedPlatform && (() => {
                const platform = tradingPlatforms.find((p) => p.value === selectedPlatform);
                return platform ? (
                  <>

                    {/* Video Section */}
                    <Box>
                      <Group gap="xs" mb="md">
                        <Video size={24} color="#FFB81C" />
                        <Title order={4}>Video hướng dẫn đăng ký tài khoản</Title>
                      </Group>
                      
                      <Paper 
                        withBorder 
                        radius="md" 
                        style={{ 
                          overflow: 'hidden',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <Box style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                          <iframe
                            src={platform.tutorialVideo.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').split('?')[0]}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              border: 'none',
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={`Hướng dẫn đăng ký ${platform.label}`}
                          />
                        </Box>
                      </Paper>

                      <Text size="xs" c="dimmed" mt="xs" ta="center">
                        💡 Xem kỹ video để đăng ký tài khoản đúng cách và nhận được ưu đãi tốt nhất
                      </Text>
                    </Box>

                    {/* CTA Section */}
                    <Paper
                      withBorder
                      p="xl"
                      radius="md"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                        borderColor: 'rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      <Stack gap="md" align="center">
                        <Box ta="center">
                          <Title order={4} mb="xs">
                            Sẵn sàng bắt đầu? 🚀
                          </Title>
                          <Text size="sm" c="dimmed">
                            Đăng ký ngay để nhận Bot giao dịch và các ưu đãi đặc biệt
                          </Text>
                        </Box>

                        <Button
                          size="xl"
                          variant="gradient"
                          gradient={{ from: 'green', to: 'teal', deg: 45 }}
                          leftSection={<ExternalLink size={20} />}
                          onClick={() => window.open(platform.platformUrl, '_blank')}
                          className={classes.glowButton}
                          style={{ 
                            minWidth: '300px',
                            height: '60px',
                            fontSize: '18px',
                          }}
                        >
                          Đăng ký tài khoản {platform.label}
                        </Button>

                        <Text size="xs" c="dimmed" ta="center">
                          Sau khi đăng ký thành công, quay lại đây và chọn tab "Đã có tài khoản (đã liên kết)" để tiếp tục
                        </Text>
                      </Stack>
                    </Paper>
                  </>
                ) : (
                  <Alert color="red" title="Lỗi">
                    <Text size="sm">
                      Vui lòng chọn một sàn giao dịch ở Bước 1 trước khi tiếp tục.
                    </Text>
                  </Alert>
                );
              })()}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="has-account-no-link" pt="xl">
            <Stack gap="lg">
              <Alert color="orange" title="Người dùng đã có tài khoản (chưa liên kết với Tradi)">
                <Text size="sm" mb="md">
                  Bạn đã có tài khoản trên sàn <strong>{tradingPlatforms.find((p) => p.value === selectedPlatform)?.label}</strong> nhưng 
                  chưa liên kết với Tradi. Vui lòng liên hệ với chúng tôi để được hỗ trợ liên kết tài khoản.
                </Text>
              </Alert>

              <Paper withBorder p="xl" radius="md">
                <Stack gap="md">
                  <Title order={4}>Liên hệ hỗ trợ</Title>
                  
                  <Group gap="xl">
                    <Group gap="xs">
                      <Mail size={20} />
                      <Box>
                        <Text size="xs" c="dimmed">Email</Text>
                        <Text size="sm" fw={500}>support@vnclc.com</Text>
                      </Box>
                    </Group>
                    
                    <Group gap="xs">
                      <Phone size={20} />
                      <Box>
                        <Text size="xs" c="dimmed">Hotline</Text>
                        <Text size="sm" fw={500}>+84 123 456 789</Text>
                      </Box>
                    </Group>
                  </Group>

                  <Button
                    variant="filled"
                    color="orange"
                    leftSection={<ExternalLink size={18} />}
                    onClick={() => {
                      // Link will be attached in the future
                      alert('Tính năng này sẽ được cập nhật trong tương lai');
                    }}
                    className={classes.glowButton}
                    mt="md"
                  >
                    Yêu cầu liên kết tài khoản
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="has-account-linked" pt="xl">
            <Stack gap="lg">
              <Alert color="green" title="Người dùng đã có tài khoản (đã liên kết với Tradi)" icon={<CheckCircle size={20} />}>
                <Text size="sm">
                  Tuyệt vời! Tài khoản của bạn đã được liên kết với Tradi. 
                  Bạn có thể tiếp tục sang bước 2 để kiểm tra email và nhận bản quyền Bot.
                </Text>
              </Alert>

              <Paper withBorder p="xl" radius="md">
                <Stack gap="md" align="center">
                  <Box
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%',
                      backgroundColor: 'var(--mantine-color-green-1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircle size={40} color="var(--mantine-color-green-7)" />
                  </Box>
                  
                  <Title order={4} ta="center">Tài khoản đã sẵn sàng</Title>
                  <Text size="sm" c="dimmed" ta="center">
                    Nhấn nút bên dưới để chuyển sang bước tiếp theo và hoàn tất việc lấy Bot.
                  </Text>

                  <Button
                    c="black"
                    size="lg"
                    onClick={() => {
                      setUserTypeModalOpen(false);
                      nextStep();
                    }}
                    className={classes.glowButton}
                    mt="md"
                  >
                    Tiếp theo
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
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