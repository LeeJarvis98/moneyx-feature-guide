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
} from '@mantine/core';
import { Download, CheckCircle, AlertCircle, Play } from 'lucide-react';

type AccountStatus = 'idle' | 'checking' | 'authorized' | 'unauthorized';

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
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Function to check account status via API
  const checkAccountStatus = async () => {
    setAccountStatus('checking');
    setErrorMessage('');
    setAccountData(null);
    
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
    { value: 'mt5', label: 'MetaTrader 5 (MT5)', disabled: true },
    { value: 'mt4', label: 'MetaTrader 4 (MT4)', disabled: true },
    { value: 'exness', label: 'Exness', disabled: false },
    { value: 'xm', label: 'XM Trading', disabled: true },
    { value: 'fbs', label: 'FBS', disabled: true },
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
                <Box>
                  <Title order={3} mb="md">
                    Chọn sàn giao dịch của bạn
                  </Title>
                  <Text c="dimmed" mb="lg">
                    Vui lòng chọn sàn giao dịch bạn đang sử dụng hoặc muốn sử dụng. Hướng dẫn sẽ hiển thị bên dưới.
                  </Text>
                </Box>

                <Grid gutter="md">
                  {tradingPlatforms.map((platformOption) => (
                    <Grid.Col key={platformOption.value} span={{ base: 12, sm: 6, md: 4 }}>
                      <Card
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        withBorder
                        style={{
                          cursor: platformOption.disabled ? 'not-allowed' : 'pointer',
                          opacity: platformOption.disabled ? 0.5 : 1,
                          border: selectedPlatform === platformOption.value 
                            ? '2px solid var(--mantine-color-blue-6)' 
                            : undefined,
                          backgroundColor: selectedPlatform === platformOption.value
                            ? 'var(--mantine-color-blue-0)'
                            : platformOption.disabled
                            ? 'var(--mantine-color-gray-1)'
                            : undefined,
                        }}
                        onClick={() => {
                          if (!platformOption.disabled) {
                            setSelectedPlatform(platformOption.value);
                            setPlatform(platformOption.value);
                          }
                        }}
                      >
                        <Stack gap="sm" align="center">
                          <Box
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: '50%',
                              backgroundColor: selectedPlatform === platformOption.value
                                ? 'var(--mantine-color-blue-6)'
                                : 'var(--mantine-color-gray-2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {selectedPlatform === platformOption.value && (
                              <CheckCircle size={30} color="white" />
                            )}
                          </Box>
                          <Text fw={500} ta="center">
                            {platformOption.label}
                          </Text>
                          {platformOption.disabled && (
                            <Badge color="gray" variant="light">
                              Sắp ra mắt
                            </Badge>
                          )}
                          {selectedPlatform === platformOption.value && !platformOption.disabled && (
                            <Badge color="blue" variant="filled">
                              Đã chọn
                            </Badge>
                          )}
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>

                {selectedPlatform && (
                  <>
                    <Alert color="blue" radius="md">
                      <Text size="sm">
                        Bạn đã chọn sàn <strong>{tradingPlatforms.find((p) => p.value === selectedPlatform)?.label}</strong>. 
                        Xem hướng dẫn chi tiết bên dưới để tạo tài khoản.
                      </Text>
                    </Alert>

                    {/* Guide Content - Changes based on selected platform */}
                    <Box mt="xl">
                      <Title order={3} mb="md">
                        Hướng dẫn tạo tài khoản {tradingPlatforms.find((p) => p.value === selectedPlatform)?.label}
                      </Title>

                      {/* Video Guides */}
                      <Box mt="xl">
                        <Title order={4} mb="md">
                          📹 Video hướng dẫn
                        </Title>
                        <Grid gutter="md">
                          {guideVideos.map((video) => (
                            <Grid.Col key={video.id} span={{ base: 12, sm: 6 }}>
                              <Card
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                withBorder
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setSelectedVideo(video.url);
                                  setVideoModalOpen(true);
                                }}
                              >
                                <Card.Section>
                                  <Image
                                    src={video.thumbnail}
                                    height={200}
                                    alt={video.title}
                                  />
                                </Card.Section>
                                <Group justify="space-between" mt="md" mb="xs">
                                  <Text fw={500}>{video.title}</Text>
                                  <ActionIcon variant="light" color="blue">
                                    <Play size={16} />
                                  </ActionIcon>
                                </Group>
                              </Card>
                            </Grid.Col>
                          ))}
                        </Grid>
                      </Box>

                      {/* Image Guides */}
                      <Box mt="xl">
                        <Title order={4} mb="md">
                          🖼️ Hướng dẫn bằng hình ảnh
                        </Title>
                        <Grid gutter="md">
                          {guideImages.map((image) => (
                            <Grid.Col key={image.id} span={{ base: 12, sm: 6, md: 4 }}>
                              <Paper shadow="sm" p="md" radius="md" withBorder>
                                <Image
                                  src={image.src}
                                  alt={image.title}
                                  radius="sm"
                                  mb="sm"
                                />
                                <Text size="sm" fw={500} ta="center">
                                  {image.title}
                                </Text>
                              </Paper>
                            </Grid.Col>
                          ))}
                        </Grid>
                      </Box>
                    </Box>
                  </>
                )}

                <Group justify="flex-end" mt="xl">
                  <Button 
                    onClick={nextStep} 
                    size="lg"
                    disabled={!selectedPlatform}
                  >
                    Tiếp theo
                  </Button>
                </Group>
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
              <Stack gap="xl">
                <Box>
                  <Title order={3} mb="md">
                    Xác thực Email của bạn
                  </Title>
                  <Text c="dimmed" mb="lg">
                    Nhập email đã đăng ký với {tradingPlatforms.find((p) => p.value === selectedPlatform)?.label} để kiểm tra tình trạng liên kết
                  </Text>
                </Box>

                <Stack gap="md">
                  <Alert color="blue" radius="md">
                    <Text size="sm">
                      <strong>Sàn đã chọn:</strong> {tradingPlatforms.find((p) => p.value === selectedPlatform)?.label}
                    </Text>
                  </Alert>

                  <TextInput
                    label="Email"
                    type="email"
                    placeholder="client@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.currentTarget.value)}
                    size="md"
                    required
                  />

                  <Button
                    onClick={checkAccountStatus}
                    loading={accountStatus === 'checking'}
                    disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                    size="lg"
                    fullWidth
                  >
                    Kiểm tra
                  </Button>
                </Stack>

                {accountStatus === 'authorized' && accountData && (
                  <Alert
                    icon={<CheckCircle size={20} />}
                    title="Xác thực thành công!"
                    color="green"
                    radius="md"
                  >
                    <Stack gap="xs">
                      <Text size="sm">
                        <strong>Client UID:</strong> {accountData.client_uid}
                      </Text>
                      <Text size="sm">
                        <strong>Tài khoản liên kết:</strong> {accountData.accounts.join(', ')}
                      </Text>
                      <Text size="sm" mt="xs">
                        Bạn có thể tiếp tục sang bước tiếp theo để tải bot.
                      </Text>
                    </Stack>
                  </Alert>
                )}

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

                <Group justify="space-between" mt="xl">
                  <Button variant="default" onClick={prevStep} size="lg">
                    Quay lại
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={accountStatus !== 'authorized'}
                    size="lg"
                  >
                    Tiếp theo
                  </Button>
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
              <Stack gap="xl" align="center">
                <Box ta="center">
                  <Badge size="xl" variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 105 }} mb="md">
                    Hoàn tất
                  </Badge>
                  <Title order={3} mb="md">
                    Tải xuống Bot Trading
                  </Title>
                  <Text c="dimmed" mb="lg">
                    Tài khoản của bạn đã được xác thực. Bây giờ bạn có thể tải xuống file bot.
                  </Text>
                </Box>

                <Paper withBorder p="xl" radius="md" style={{ width: '100%', maxWidth: 500 }}>
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
                    
                    <Group gap="xs">
                      <Badge color="blue">{tradingPlatforms.find((p) => p.value === selectedPlatform)?.label} Compatible</Badge>
                      <Badge color="green">Verified</Badge>
                    </Group>

                    <Text size="sm" c="dimmed" ta="center">
                      File bot đã được tối ưu hóa cho tài khoản của bạn
                    </Text>

                    <Button
                      size="lg"
                      leftSection={<Download size={20} />}
                      onClick={handleDownloadBot}
                      fullWidth
                      mt="md"
                    >
                      Tải xuống Bot
                    </Button>
                  </Stack>
                </Paper>

                <Alert color="blue" radius="md" style={{ width: '100%', maxWidth: 500 }}>
                  <Text size="sm">
                    <strong>Lưu ý:</strong> Sau khi tải xuống, vui lòng làm theo hướng dẫn cài đặt
                    trong tài liệu để cấu hình bot đúng cách.
                  </Text>
                </Alert>

                <Group justify="space-between" mt="xl" style={{ width: '100%' }}>
                  <Button variant="default" onClick={prevStep} size="lg">
                    Quay lại
                  </Button>
                  <Button
                    variant="light"
                    onClick={() => setActive(0)}
                    size="lg"
                  >
                    Bắt đầu lại
                  </Button>
                </Group>
              </Stack>
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