'use client';

import { useState, useEffect, type ReactNode } from 'react';
import {
  Timeline,
  Text,
  Badge,
  Group,
  Stack,
  Progress,
  Loader,
  Alert,
  Paper,
  Title,
  ThemeIcon,
  Center,
  ScrollArea,
} from '@mantine/core';
import { Gift, CheckCircle2, Lock, AlertCircle, Trophy } from 'lucide-react';
import styles from './RewardSystemTab.module.css';

interface RewardLevel {
  level: number;
  lot_volume: number;
  reward_usd: number;
  reward_text: string | null;
  is_active: boolean;
}

interface RewardProgress {
  platform: string;
  partnerId: string;
  levels: RewardLevel[];
  currentLots: number;
  currentLevel: number;
  error?: string;
  message?: string;
}

const PLATFORM_LABEL: Record<string, string> = {
  exness: 'Exness',
};

interface RewardSystemTabProps {
  onNavbarContentChange?: (content: ReactNode) => void;
}

export function RewardSystemTab({ onNavbarContentChange }: RewardSystemTabProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RewardProgress | null>(null);
  const [softError, setSoftError] = useState<string | null>(null);
  const [hardError, setHardError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  // Sync the reward timeline into the AppShell navbar
  useEffect(() => {
    if (!onNavbarContentChange) return;

    if (!data) {
      onNavbarContentChange(null);
      return;
    }

    const { levels, currentLots, currentLevel } = data;

    const displayLevels = levels
      .filter((l) => l.level === 0 || l.is_active)
      .sort((a, b) => a.level - b.level);

    const activeIndex = displayLevels.findIndex((l) => l.level === currentLevel);
    const fmt = (n: number) => (n >= 1000 ? n.toLocaleString('vi-VN') : n.toString());

    onNavbarContentChange(
      <ScrollArea h="100%" type="auto" offsetScrollbars>
        <Stack gap="md">
          <Text fw={700} size="md" c="dimmed" tt="uppercase">Lộ trình thưởng</Text>
          <Timeline active={activeIndex} bulletSize={36} lineWidth={3} color="grape">
            {displayLevels.map((lvl) => {
              const isCompleted = lvl.level <= currentLevel;
              const isCurrent = lvl.level === currentLevel;
              return (
                <Timeline.Item
                  key={lvl.level}
                  bullet={isCompleted ? <CheckCircle2 size={18} /> : <Lock size={18} />}
                  color={isCompleted ? 'grape' : 'gray'}
                  title={
                    <Group gap="sm" align="center">
                      <Text fw={700} size="md" c={isCurrent ? 'grape.4' : isCompleted ? 'white' : 'dimmed'}>
                        Level {lvl.level}
                        {lvl.level === 0 && (
                          <Text span c="dimmed" fw={400} size="sm"> (Cơ bản)</Text>
                        )}
                      </Text>
                      {isCurrent && (
                        <Badge size="sm" color="grape" variant="filled">Hiện tại</Badge>
                      )}
                    </Group>
                  }
                >
                  <Stack gap={4} mt={4}>
                    <Text size="md" c={isCompleted ? 'white' : 'dimmed'}>
                      {fmt(lvl.lot_volume)} lots →{' '}
                      <Text span fw={700} c={isCompleted ? 'grape.4' : 'dimmed'}>
                        ${fmt(lvl.reward_usd)}
                      </Text>
                    </Text>
                    {lvl.reward_text && (
                      <Text size="sm" c="yellow.5" fs="italic">
                        {lvl.reward_text}
                      </Text>
                    )}
                  </Stack>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Stack>
      </ScrollArea>
    );

    return () => {
      onNavbarContentChange?.(null);
    };
  }, [data, onNavbarContentChange]);

  const fetchProgress = async () => {
    setLoading(true);
    setHardError(null);
    setSoftError(null);

    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
      setHardError('Vui lòng đăng nhập để xem hệ thống thưởng.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/get-reward-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json: RewardProgress = await res.json();

      if (!res.ok) {
        setHardError(json.message ?? 'Không thể tải dữ liệu hệ thống thưởng.');
        return;
      }

      if (json.error === 'NO_REFERRAL' || json.error === 'NO_PARTNER_CONFIG') {
        setSoftError(json.message ?? 'Chưa có cấu hình hệ thống thưởng.');
        return;
      }

      setData(json);
    } catch {
      setHardError('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center className={styles.loadingCenter}>
        <Stack align="center" gap="md">
          <Loader color="grape" size="lg" />
          <Text c="dimmed" size="sm">Đang tải hệ thống thưởng...</Text>
        </Stack>
      </Center>
    );
  }

  if (hardError) {
    return (
      <div className={styles.container}>
        <Alert icon={<AlertCircle size={16} />} color="red" title="Lỗi">
          {hardError}
        </Alert>
      </div>
    );
  }

  if (softError) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title order={2} c="white">Hệ Thống Thưởng</Title>
        </div>
        <Paper className={styles.emptyCard}>
          <Stack align="center" gap="md" py="xl">
            <ThemeIcon size={64} radius="xl" color="grape" variant="light">
              <Gift size={32} />
            </ThemeIcon>
            <Title order={4} c="white" ta="center">Chưa có cấu hình thưởng</Title>
            <Text c="dimmed" ta="center" size="sm" maw={400}>
              {softError}
            </Text>
          </Stack>
        </Paper>
      </div>
    );
  }

  if (!data) return null;

  const { levels, currentLots, currentLevel, platform } = data;

  // Include level 0 always as baseline + all active levels
  const displayLevels = levels
    .filter((l) => l.level === 0 || l.is_active)
    .sort((a, b) => a.level - b.level);

  const nextLevel = displayLevels.find((l) => l.level > currentLevel && l.is_active);
  const progressPct = nextLevel
    ? Math.min(100, (currentLots / nextLevel.lot_volume) * 100)
    : 100;

  // Timeline active index: position of currentLevel in displayLevels
  const activeIndex = displayLevels.findIndex((l) => l.level === currentLevel);

  const formatNumber = (n: number) =>
    n >= 1000 ? n.toLocaleString('vi-VN') : n.toString();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title order={2} c="white">Hệ Thống Thưởng</Title>
        <Badge
          variant="gradient"
          gradient={{ from: 'grape', to: 'pink' }}
          size="lg"
        >
          {PLATFORM_LABEL[platform] ?? platform}
        </Badge>
      </div>

      {/* Progress summary card */}
      <Paper className={styles.progressCard}>
        <Group justify="space-between" align="flex-start" mb="sm">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Khối lượng giao dịch</Text>
            <Group gap="xs" align="baseline">
              <Text size="xl" fw={800} c="white">{currentLots.toFixed(2)}</Text>
              <Text size="sm" c="dimmed">lots</Text>
            </Group>
          </Stack>
          <Stack gap={2} ta="right">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Cấp độ hiện tại</Text>
            <Group gap="xs" align="center" justify="flex-end">
              <ThemeIcon size="sm" color="grape" variant="filled" radius="xl">
                <Trophy size={12} />
              </ThemeIcon>
              <Text size="xl" fw={800} c="grape.4">Level {currentLevel}</Text>
            </Group>
          </Stack>
        </Group>

        {nextLevel ? (
          <>
            <Progress
              value={progressPct}
              color="grape"
              size="md"
              radius="xl"
              animated={progressPct < 100}
            />
            <Group justify="space-between" mt="xs">
              <Text size="xs" c="dimmed">{currentLots.toFixed(2)} lots</Text>
              <Text size="xs" c="dimmed">
                Mục tiêu: {formatNumber(nextLevel.lot_volume)} lots → Level {nextLevel.level}
              </Text>
            </Group>
          </>
        ) : (
          <Group gap="xs" mt="xs">
            <CheckCircle2 size={16} color="#ae3ec9" />
            <Text size="sm" c="grape.4" fw={600}>Bạn đã đạt cấp độ cao nhất!</Text>
          </Group>
        )}
      </Paper>

    </div>
  );
}

