'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Group,
  Text,
  Title,
  Badge,
  Switch,
  NumberInput,
  TextInput,
  Button,
  Alert,
  Paper,
  Loader,
  Select,
  Divider,
  ActionIcon,
  Tooltip,
  Center,
} from '@mantine/core';
import { Save, Info, RotateCcw, CheckCircle, Lock, Zap } from 'lucide-react';
import styles from './PartnerRewardConfig.module.css';

interface LevelState {
  level: number;
  lot_volume: number;
  reward_usd: number;
  reward_text: string;
  is_active: boolean;
}

const SUPPORTED_PLATFORMS = [
  { value: 'exness', label: 'Exness' },
  { value: 'lirunex', label: 'Lirunex' },
];

const DEFAULT_LEVELS: LevelState[] = [
  { level: 0, lot_volume: 0, reward_usd: 0, reward_text: '', is_active: true },
  { level: 1, lot_volume: 10, reward_usd: 200, reward_text: '', is_active: false },
  { level: 2, lot_volume: 20, reward_usd: 400, reward_text: '', is_active: false },
  { level: 3, lot_volume: 40, reward_usd: 600, reward_text: '', is_active: false },
  { level: 4, lot_volume: 80, reward_usd: 1000, reward_text: '', is_active: false },
  { level: 5, lot_volume: 200, reward_usd: 1400, reward_text: '', is_active: false },
  { level: 6, lot_volume: 500, reward_usd: 2000, reward_text: '', is_active: false },
  { level: 7, lot_volume: 1000, reward_usd: 6000, reward_text: '', is_active: false },
  { level: 8, lot_volume: 1500, reward_usd: 10000, reward_text: '', is_active: false },
  { level: 9, lot_volume: 2000, reward_usd: 16000, reward_text: '', is_active: false },
  { level: 10, lot_volume: 3000, reward_usd: 20000, reward_text: '', is_active: false },
];

interface PartnerRewardConfigProps {
  platform?: string;
  selectedPlatforms?: string[];
}

export default function PartnerRewardConfig({ platform: initialPlatform = 'exness', selectedPlatforms }: PartnerRewardConfigProps) {
  const availablePlatforms = useMemo(() => {
    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      return SUPPORTED_PLATFORMS;
    }
    const filtered = SUPPORTED_PLATFORMS.filter((p) => selectedPlatforms.includes(p.value));
    return filtered.length > 0 ? filtered : SUPPORTED_PLATFORMS;
  }, [selectedPlatforms]);

  const [platform, setPlatform] = useState<string>(initialPlatform);
  const [levels, setLevels] = useState<LevelState[]>(DEFAULT_LEVELS.map((l) => ({ ...l })));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedPlatform, setAppliedPlatform] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync platform state when available platforms list changes
  useEffect(() => {
    if (!availablePlatforms.find((p) => p.value === platform)) {
      setPlatform(availablePlatforms[0]?.value || 'exness');
    }
  }, [availablePlatforms]);

  useEffect(() => {
    loadConfig(platform);
  }, [platform]);

  const loadConfig = async (plat: string) => {
    setLoading(true);
    setError(null);

    const partnerId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!partnerId) {
      setError('Không tìm thấy ID người dùng.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/get-reward-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Không thể tải cấu hình.');
        setLoading(false);
        return;
      }

      const existingConfigs: Array<{
        level: number;
        lot_volume: number;
        reward_usd: number;
        reward_text: string | null;
        is_active: boolean;
        is_applied: boolean;
      }> = (json.configs ?? []).filter(
        (c: { platform: string }) => c.platform === plat,
      );

      // Detect which platform is currently applied from ALL configs
      const allConfigs: Array<{ platform: string; is_applied: boolean }> = json.configs ?? [];
      const alreadyApplied = allConfigs.find((c) => c.is_applied);
      setAppliedPlatform(alreadyApplied?.platform ?? null);

      if (existingConfigs.length === 0) {
        // No config yet — use defaults
        setLevels(DEFAULT_LEVELS.map((l) => ({ ...l })));
      } else {
        const mapped = DEFAULT_LEVELS.map((def) => {
          const saved = existingConfigs.find((c) => c.level === def.level);
          if (saved) {
            return {
              level: saved.level,
              lot_volume: Number(saved.lot_volume),
              reward_usd: Number(saved.reward_usd),
              reward_text: saved.reward_text ?? '',
              is_active: saved.level === 0 ? true : saved.is_active,
            };
          }
          return { ...def };
        });
        setLevels(mapped);
      }
    } catch {
      setError('Không thể kết nối tới máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const isLevelToggleable = (idx: number): boolean => {
    if (idx <= 1) return true;
    return levels[idx - 1].is_active;
  };

  const handleLevelChange = (
    levelIndex: number,
    field: keyof LevelState,
    value: string | number | boolean,
  ) => {
    if (field === 'is_active' && value === false) {
      // When disabling a level, cascade-disable all subsequent levels
      setLevels((prev) =>
        prev.map((l, i) => {
          if (i < levelIndex) return l;
          return { ...l, is_active: false };
        }),
      );
    } else {
      setLevels((prev) =>
        prev.map((l, i) => {
          if (i !== levelIndex) return l;
          return { ...l, [field]: value };
        }),
      );
    }
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    const partnerId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!partnerId) {
      setError('Không tìm thấy ID người dùng.');
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/save-reward-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          platform,
          levels: levels.map((l) => ({
            level: l.level,
            lot_volume: l.lot_volume,
            reward_usd: l.reward_usd,
            reward_text: l.reward_text.trim() || null,
            is_active: l.level === 0 ? true : l.is_active,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Lưu thất bại.');
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError('Không thể kết nối tới máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLevels(DEFAULT_LEVELS.map((l) => ({ ...l })));
    setSaveSuccess(false);
    setError(null);
  };

  const handleToggleAll = () => {
    const anyInactive = levels.slice(1).some((l) => !l.is_active);
    setLevels((prev) => prev.map((l, i) => (i === 0 ? l : { ...l, is_active: anyInactive })));
    setSaveSuccess(false);
  };

  const handleApply = async () => {
    const partnerId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!partnerId) {
      setError('Không tìm thấy ID người dùng.');
      return;
    }

    setApplying(true);
    setError(null);
    setApplySuccess(false);

    try {
      const res = await fetch('/api/apply-reward-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, platform }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Không thể áp dụng thiết lập.');
        return;
      }

      setAppliedPlatform(platform);
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 3000);
    } catch {
      setError('Không thể kết nối tới máy chủ.');
    } finally {
      setApplying(false);
    }
  };

  const activeCount = levels.filter((l) => l.level > 0 && l.is_active).length;
  const allLevelsActive = levels.slice(1).every((l) => l.is_active);
  const isCurrentPlatformApplied = appliedPlatform === platform;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <Title order={3} c="white" mb={4}>Cấu hình Hệ Thống Thưởng</Title>
          <Text size="sm" c="dimmed">
            Thiết lập các mốc thưởng cho khách hàng được giới thiệu bởi bạn.
          </Text>
        </div>
        <Group gap="sm">
          <Tooltip label={allLevelsActive ? 'Tắt tất cả cấp độ' : 'Bật tất cả cấp độ'}>
            <Button
              variant="light"
              size="sm"
              onClick={handleToggleAll}
              disabled={loading}
              className={allLevelsActive ? styles.toggleAllButtonOff : styles.toggleAllButtonOn}
            >
              {allLevelsActive ? 'Tắt tất cả' : 'Bật tất cả'}
            </Button>
          </Tooltip>
          <Tooltip label="Đặt lại về mặc định">
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={handleReset}>
              <RotateCcw size={16} />
            </ActionIcon>
          </Tooltip>
          <Button
            leftSection={<Zap size={16} />}
            onClick={handleApply}
            loading={applying}
            disabled={loading || saving}
            className={isCurrentPlatformApplied ? styles.applyButtonActive : styles.applyButton}
          >
            {isCurrentPlatformApplied ? 'Đang áp dụng' : 'Áp dụng thiết lập'}
          </Button>
          <Button
            leftSection={<Save size={16} />}
            onClick={handleSave}
            loading={saving}
            disabled={loading}
            className={styles.saveButton}
          >
            Lưu cấu hình
          </Button>
        </Group>
      </div>

      {error && (
        <Alert color="red" icon={<Info size={16} />} onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {saveSuccess && (
        <Alert color="green" icon={<CheckCircle size={16} />}>
          Đã lưu cấu hình thành công!
        </Alert>
      )}

      {applySuccess && (
        <Alert color="yellow" icon={<Zap size={16} />}>
          Đã áp dụng thiết lập thưởng cho sàn <strong>{availablePlatforms.find((p) => p.value === platform)?.label ?? platform}</strong>. Các sàn khác đã được tắt.
        </Alert>
      )}

      <Group gap="md" align="flex-end">
        {availablePlatforms.length > 1 ? (
          <Select
            label="Sàn giao dịch"
            data={availablePlatforms}
            value={platform}
            onChange={(v) => v && setPlatform(v)}
            className={styles.platformSelect}
          />
        ) : (
          <div>
            <Text size="xs" c="dimmed" mb={4}>Sàn giao dịch</Text>
            <Badge color="yellow" size="lg" variant="light">
              {availablePlatforms[0]?.label ?? platform}
            </Badge>
          </div>
        )}
        <Badge color="yellow" size="lg" variant="light">
          {activeCount} cấp độ đang hoạt động
        </Badge>
        {appliedPlatform && (
          <Badge color={isCurrentPlatformApplied ? 'green' : 'gray'} size="lg" variant="light">
            {isCurrentPlatformApplied
              ? '✓ Đang áp dụng'
              : `Đang áp dụng: ${availablePlatforms.find((p) => p.value === appliedPlatform)?.label ?? appliedPlatform}`}
          </Badge>
        )}
      </Group>

      {loading ? (
        <Center py="xl">
          <Loader color="yellow" />
        </Center>
      ) : (
        <Stack gap="sm">
          {/* Level 0 — fixed baseline */}
          <Paper className={`${styles.levelCard} ${styles.levelCardFixed}`}>
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <Badge size="sm" color="gray" variant="outline">Level 0</Badge>
                <Text size="sm" c="dimmed">Cơ bản (cố định)</Text>
              </Group>
              <Text size="sm" c="dimmed">0 lots thưởng $0</Text>
            </Group>
          </Paper>

          <Divider label="Các mốc thưởng (Level 1 – 10)" labelPosition="left" color="gray.7" />

          {levels.slice(1).map((lvl, idx) => {
            const realIndex = idx + 1;
            const canToggle = isLevelToggleable(realIndex);
            const isLocked = !canToggle;
            return (
              <Paper
                key={lvl.level}
                className={`${styles.levelCard} ${lvl.is_active ? styles.levelCardActive : ''} ${isLocked ? styles.levelCardLocked : ''}`}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Group gap="sm" align="center" style={{ minWidth: 110 }}>
                    <Badge
                      size="sm"
                      color={lvl.is_active ? 'yellow' : 'gray'}
                      variant={lvl.is_active ? 'filled' : 'outline'}
                    >
                      Level {lvl.level}
                    </Badge>
                    {isLocked ? (
                      <Tooltip label={`Kích hoạt Level ${lvl.level - 1} trước`}>
                        <span className={styles.lockIcon}>
                          <Lock size={14} />
                        </span>
                      </Tooltip>
                    ) : (
                      <Switch
                        checked={lvl.is_active}
                        onChange={(e) =>
                          handleLevelChange(realIndex, 'is_active', e.currentTarget.checked)
                        }
                        color="yellow"
                        size="sm"
                        aria-label={`Kích hoạt level ${lvl.level}`}
                      />
                    )}
                  </Group>

                  <Group gap="sm" style={{ flex: 1 }} wrap="wrap">
                    <NumberInput
                      label="Lots"
                      value={lvl.lot_volume}
                      onChange={(v) =>
                        handleLevelChange(realIndex, 'lot_volume', Number(v) || 0)
                      }
                      min={0}
                      step={1}
                      disabled={!lvl.is_active}
                      className={styles.numberInput}
                      allowNegative={false}
                    />
                    <NumberInput
                      label="Thưởng USD ($)"
                      value={lvl.reward_usd}
                      onChange={(v) =>
                        handleLevelChange(realIndex, 'reward_usd', Number(v) || 0)
                      }
                      min={0}
                      step={100}
                      disabled={!lvl.is_active}
                      className={styles.numberInput}
                      allowNegative={false}
                      prefix="$"
                    />
                    <TextInput
                      label="Thưởng phụ (tuỳ chọn)"
                      placeholder="VD: Smartphone cao cấp"
                      value={lvl.reward_text}
                      onChange={(e) =>
                        handleLevelChange(realIndex, 'reward_text', e.currentTarget.value)
                      }
                      disabled={!lvl.is_active}
                      className={styles.textInput}
                      maxLength={500}
                    />
                  </Group>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}
    </div>
  );
}

