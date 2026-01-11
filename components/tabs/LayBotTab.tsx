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

export function LayBotTab() {
  const [active, setActive] = useState(0);
  const [accountId, setAccountId] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('idle');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState('');

  // Mock function to check account status (replace with actual API call)
  const checkAccountStatus = async () => {
    setAccountStatus('checking');
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Mock validation - check if account ID is not empty and platform is selected
    if (accountId && platform) {
      // For demo purposes, accounts starting with "MT5" are authorized
      if (accountId.toUpperCase().startsWith('MT5')) {
        setAccountStatus('authorized');
      } else {
        setAccountStatus('unauthorized');
      }
    } else {
      setAccountStatus('unauthorized');
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
    { value: 'mt5', label: 'MetaTrader 5 (MT5)' },
    { value: 'mt4', label: 'MetaTrader 4 (MT4)' },
    { value: 'exness', label: 'Exness' },
    { value: 'xm', label: 'XM Trading' },
    { value: 'fbs', label: 'FBS' },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Box>
          <Title order={2} mb="md" ta="center">
            Lấy Bot Trading
          </Title>
          <Text c="dimmed" ta="center" mb="xl">
            Làm theo 3 bước đơn giản để nhận và cài đặt bot trading
          </Text>
        </Box>

        <Stepper active={active} onStepClick={setActive}>
          {/* Step 1: Tạo tài khoản sàn */}
          <Stepper.Step
            label="Bước 1"
            description="Tạo tài khoản sàn"
            allowStepSelect={true}
          >
            <Paper shadow="sm" p="xl" radius="md" mt="xl">
              <Stack gap="xl">
                <Box>
                  <Title order={3} mb="md">
                    Tạo tài khoản sàn giao dịch
                  </Title>
                  <Text c="dimmed" mb="lg">
                    Xem video và hình ảnh hướng dẫn để tạo tài khoản trên sàn giao dịch
                  </Text>
                </Box>

                {/* Video Guides */}
                <Box>
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
                <Box>
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

                <Group justify="flex-end" mt="xl">
                  <Button onClick={nextStep} size="lg">
                    Tiếp theo
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Stepper.Step>

          {/* Step 2: Kiểm tra tình trạng ID MT5 */}
          <Stepper.Step
            label="Bước 2"
            description="Kiểm tra ID"
            allowStepSelect={accountStatus === 'authorized'}
          >
            <Paper shadow="sm" p="xl" radius="md" mt="xl">
              <Stack gap="xl">
                <Box>
                  <Title order={3} mb="md">
                    Kiểm tra tình trạng ID MT5
                  </Title>
                  <Text c="dimmed" mb="lg">
                    Nhập ID tài khoản và chọn sàn giao dịch để kiểm tra tình trạng
                  </Text>
                </Box>

                <Stack gap="md">
                  <Select
                    label="Chọn sàn giao dịch"
                    placeholder="Chọn sàn"
                    data={tradingPlatforms}
                    value={platform}
                    onChange={setPlatform}
                    size="md"
                    required
                  />

                  <TextInput
                    label="ID tài khoản"
                    placeholder="Nhập ID tài khoản của bạn"
                    value={accountId}
                    onChange={(event) => setAccountId(event.currentTarget.value)}
                    size="md"
                    required
                  />

                  <Button
                    onClick={checkAccountStatus}
                    loading={accountStatus === 'checking'}
                    disabled={!accountId || !platform}
                    size="lg"
                    fullWidth
                  >
                    Kiểm tra
                  </Button>
                </Stack>

                {accountStatus === 'authorized' && (
                  <Alert
                    icon={<CheckCircle size={20} />}
                    title="Xác thực thành công!"
                    color="green"
                    radius="md"
                  >
                    Tài khoản {accountId} trên sàn{' '}
                    {tradingPlatforms.find((p) => p.value === platform)?.label} đã được xác thực.
                    Bạn có thể tiếp tục sang bước tiếp theo.
                  </Alert>
                )}

                {accountStatus === 'unauthorized' && (
                  <Alert
                    icon={<AlertCircle size={20} />}
                    title="Xác thực thất bại"
                    color="red"
                    radius="md"
                  >
                    Không thể xác thực tài khoản. Vui lòng kiểm tra lại ID và sàn giao dịch.
                    Đảm bảo ID bắt đầu với "MT5" để được xác thực (demo mode).
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
                      <Badge color="blue">MT5 Compatible</Badge>
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