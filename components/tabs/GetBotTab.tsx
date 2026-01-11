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
} from '@mantine/core';
import { Download, CheckCircle, AlertCircle, Play, ExternalLink, Video } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState('');

  // Function to check account status via API
  const checkAccountStatus = async () => {
    setAccountStatus('checking');
    setErrorMessage('');
    setAccountData(null);
    setAccountRows([]);
    setSelectedAccounts([]);

    try {
      const response = await fetch('https://rainbowy-clarine-presumingly.ngrok-free.dev/api/lookup', {
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
        // Convert accounts array to table rows with default status
        const rows: AccountRow[] = result.data.accounts.map((accountId: string) => ({
          id: accountId,
          status: 'unlicensed' as const, // Default status - can be updated based on API response
        }));
        setAccountRows(rows);
        setAccountStatus('authorized');
      } else {
        setAccountStatus('unauthorized');
        setErrorMessage('Tài khoản không có quyền truy cập hoặc chưa được liên kết.');
      }
    } catch (error) {
      setAccountStatus('unauthorized');
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      console.error('API Error:', error);
    }
  };

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const toggleAllAccounts = () => {
    if (selectedAccounts.length === accountRows.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accountRows.map((row) => row.id));
    }
  };

  const handleDownloadBot = () => {
    // This will be replaced with actual download logic
    alert('Bot file download will be implemented here. Please provide the bot file.');
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
      tutorialVideo: 'https://example.com/exness-tutorial',
      platformUrl: 'https://one.exnessonelink.com/a/ojl5148a7y'
    },
    {
      value: 'binance',
      label: 'Binance',
      disabled: true,
      image: '/getbot_section/binance.png',
      tutorialVideo: 'https://example.com/binance-tutorial',
      platformUrl: 'https://www.binance.com/'
    },
    {
      value: 'bingx',
      label: 'BingX',
      disabled: true,
      image: '/getbot_section/bingx.png',
      tutorialVideo: 'https://example.com/bingx-tutorial',
      platformUrl: 'https://bingx.com/'
    },
    {
      value: 'bitget',
      label: 'BitGet',
      disabled: true,
      image: '/getbot_section/bitget.png',
      tutorialVideo: 'https://example.com/bitget-tutorial',
      platformUrl: 'https://www.bitget.com/'
    },
    {
      value: 'bybit',
      label: 'Bybit',
      disabled: true,
      image: '/getbot_section/bybit.png',
      tutorialVideo: 'https://example.com/bybit-tutorial',
      platformUrl: 'https://www.bybit.com/'
    },
    {
      value: 'gate',
      label: 'Gate.io',
      disabled: true,
      image: '/getbot_section/gate.png',
      tutorialVideo: 'https://example.com/gate-tutorial',
      platformUrl: 'https://www.gate.io/'
    },
    {
      value: 'mexc',
      label: 'MEXC',
      disabled: true,
      image: '/getbot_section/mexc.png',
      tutorialVideo: 'https://example.com/mexc-tutorial',
      platformUrl: 'https://www.mexc.com/'
    },
    {
      value: 'okx',
      label: 'OKX',
      disabled: true,
      image: '/getbot_section/okx.png',
      tutorialVideo: 'https://example.com/okx-tutorial',
      platformUrl: 'https://www.okx.com/'
    },
    {
      value: 'vantage',
      label: 'Vantage',
      disabled: true,
      image: '/getbot_section/vantage.png',
      tutorialVideo: 'https://example.com/vantage-tutorial',
      platformUrl: 'https://www.vantagemarkets.com/'
    },
    {
      value: 'xm',
      label: 'XM',
      disabled: true,
      image: '/getbot_section/xm.png',
      tutorialVideo: 'https://example.com/xm-tutorial',
      platformUrl: 'https://www.xm.com/'
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
                    onClick={nextStep}
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
                      >
                        <div className={classes.cardContent} style={{ marginTop: '-20px' }}>
                          <Title order={3} className={classes.platformTitle}>
                            {platformOption.label}
                          </Title>
                        </div>

                        {!platformOption.disabled && (
                          <div className={`${classes.cardContent} ${classes.buttonGroup}`}>
                            <Button
                              variant="white"
                              color="dark"
                              leftSection={<Video size={18} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVideo(platformOption.tutorialVideo);
                                setVideoModalOpen(true);
                              }}
                              fullWidth
                              className={classes.glowButton}
                              size="xs"
                            >
                              Hướng dẫn
                            </Button>
                            <Button
                              variant="light"
                              color="green"
                              leftSection={<ExternalLink size={18} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(platformOption.platformUrl, '_blank');
                              }}
                              fullWidth
                              className={classes.glowButton}
                              size="xs"
                            >
                              Đăng ký
                            </Button>
                          </div>
                        )}
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
                        Danh sách tài khoản liên kết:
                      </Text>
                      <Table
                        striped
                        highlightOnHover
                        withTableBorder
                        withColumnBorders
                        style={{
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ width: 60 }}>
                              <Checkbox
                                checked={selectedAccounts.length === accountRows.length && accountRows.length > 0}
                                indeterminate={selectedAccounts.length > 0 && selectedAccounts.length < accountRows.length}
                                onChange={toggleAllAccounts}
                                aria-label="Chọn tất cả"
                              />
                            </Table.Th>
                            <Table.Th>ID liên kết</Table.Th>
                            <Table.Th>Trạng thái</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {accountRows.map((row) => (
                            <Table.Tr key={row.id}>
                              <Table.Td>
                                <Checkbox
                                  checked={selectedAccounts.includes(row.id)}
                                  onChange={() => toggleAccountSelection(row.id)}
                                  aria-label={`Chọn ${row.id}`}
                                />
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" ff="monospace">
                                  {row.id}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  color={row.status === 'licensed' ? 'green' : 'gray'}
                                  variant="light"
                                >
                                  {row.status === 'licensed' ? 'Đã cấp bản quyền' : 'Chưa cấp bản quyền'}
                                </Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
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
                      onClick={nextStep}
                      disabled={accountStatus !== 'authorized'}
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