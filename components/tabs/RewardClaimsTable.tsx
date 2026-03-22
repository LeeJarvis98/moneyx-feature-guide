'use client';

import { useState, useEffect, useRef } from 'react';
import { Table, Badge, Button, Text, Group, Loader, Modal, Stack, TextInput, Paper, Select } from '@mantine/core';
import styles from './RewardClaimsTable.module.css';

type ClaimStatus = 'not_claimed' | 'processing' | 'claimed' | 'denied' | 'error';

interface RewardClaim {
  id: string;
  level: number;
  reward_usd: number;
  reward_text: string | null;
  status: ClaimStatus;
  chosen_reward: 'usd' | 'text' | null;
  completed_at: string | null;
  created_at: string;
}

interface UnlockedLevel {
  level: number;
  reward_usd: number;
  reward_text: string | null;
}

interface RewardClaimsTableProps {
  userId: string;
  platform: string;
  partnerId: string;
  currentLevel: number;
  unlockedLevels: UnlockedLevel[];
}

const STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string }> = {
  not_claimed: { label: 'Chưa nhận', color: 'yellow' },
  processing:  { label: 'Đang xử lý', color: 'blue' },
  claimed:     { label: 'Đã nhận', color: 'green' },
  denied:      { label: 'Từ chối', color: 'red' },
  error:       { label: 'Lỗi - Liên hệ hỗ trợ', color: 'red' },
};

export function RewardClaimsTable({
  userId,
  platform,
  partnerId,
  currentLevel,
  unlockedLevels,
}: RewardClaimsTableProps) {
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [rewardChoices, setRewardChoices] = useState<Record<string, 'usd' | 'text'>>({});
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [pendingClaimId, setPendingClaimId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Keep a stable ref to unlockedLevels so the effect only re-runs when currentLevel changes
  const unlockedLevelsRef = useRef(unlockedLevels);
  unlockedLevelsRef.current = unlockedLevels;

  useEffect(() => {
    let cancelled = false;

    if (!unlockedLevelsRef.current.length) {
      setClaims([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch('/api/get-reward-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        platform,
        partnerId,
        unlockedLevels: unlockedLevelsRef.current,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          const fetched: RewardClaim[] = json.claims ?? [];
          setClaims(fetched);
          // Initialise default choice for each unclaimed row (prefer 'usd' when available)
          setRewardChoices((prev) => {
            const next = { ...prev };
            fetched.forEach((c) => {
              if (!(c.id in next)) {
                next[c.id] = c.reward_usd > 0 ? 'usd' : 'text';
              }
            });
            return next;
          });
        }
      })
      .catch((err) => console.error('[RewardClaimsTable]', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // Re-sync whenever currentLevel grows (new milestone reached) or identity props change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, platform, partnerId, currentLevel]);

  const handleClaim = async (claimId: string) => {
    const chosenReward = rewardChoices[claimId] ?? 'usd';
    try {
      const res = await fetch('/api/get-bank-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      const hasBankInfo = !!(
        json.bankInfo?.bank_name?.trim() &&
        json.bankInfo?.account_number?.trim() &&
        json.bankInfo?.account_name?.trim()
      );
      if (!hasBankInfo) {
        setPendingClaimId(claimId);
        setBankForm({ bank_name: '', account_number: '', account_name: '' });
        setBankError(null);
        setBankModalOpen(true);
        return;
      }
    } catch {
      // bank info check failed — proceed anyway
    }
    await submitClaim(claimId, chosenReward);
  };

  const submitClaim = async (claimId: string, chosenReward: 'usd' | 'text') => {
    setClaimingId(claimId);
    try {
      const res = await fetch('/api/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, claimId, chosenReward }),
      });
      if (res.ok) {
        setClaims((prev) =>
          prev.map((c) =>
            c.id === claimId
              ? { ...c, status: 'processing' as ClaimStatus, chosen_reward: chosenReward }
              : c,
          ),
        );
      }
    } catch (err) {
      console.error('[RewardClaimsTable] claim failed:', err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleBankSaveAndClaim = async () => {
    if (!bankForm.bank_name.trim() || !bankForm.account_number.trim() || !bankForm.account_name.trim()) {
      setBankError('Vui lòng điền đầy đủ thông tin ngân hàng.');
      return;
    }
    setBankSaving(true);
    setBankError(null);
    try {
      const res = await fetch('/api/update-bank-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bankInfo: bankForm }),
      });
      if (!res.ok) throw new Error('bank save failed');
      setBankModalOpen(false);
      if (pendingClaimId) {
        await submitClaim(pendingClaimId, rewardChoices[pendingClaimId] ?? 'usd');
        setPendingClaimId(null);
      }
    } catch {
      setBankError('Không thể lưu thông tin ngân hàng. Vui lòng thử lại.');
    } finally {
      setBankSaving(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '\u2014';
    return new Date(d).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatReward = (usd: number, text: string | null) => {
    if (usd > 0) return `$${usd >= 1000 ? usd.toLocaleString('vi-VN') : usd}`;
    return text ?? '\u2014';
  };

  if (loading) {
    return (
      <Paper className={styles.tablePaper}>
        <Group justify="center" py="lg">
          <Loader color="grape" size="sm" />
        </Group>
      </Paper>
    );
  }

  return (
    <>
      <Paper className={styles.tablePaper}>
        <Text className={styles.sectionLabel}>Danh sách phần thưởng</Text>
        <Table className={styles.table}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cấp độ</Table.Th>
              <Table.Th>Phần thưởng</Table.Th>
              <Table.Th className={styles.statusCell}>Trạng thái</Table.Th>
              <Table.Th>Thời gian hoàn thành</Table.Th>
              <Table.Th>Hành động</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {claims.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" c="dimmed" size="sm" py="md">Chưa có phần thưởng nào để hiển thị.</Text>
                </Table.Td>
              </Table.Tr>
            ) : claims.map((claim) => {
              const cfg = STATUS_CONFIG[claim.status] ?? STATUS_CONFIG.error;
              return (
                <Table.Tr key={claim.id}>
                  <Table.Td>
                    <Text fw={600} c="white">{claim.level}</Text>
                  </Table.Td>
                  <Table.Td>
                    {claim.status === 'not_claimed' && claim.reward_usd > 0 && claim.reward_text ? (
                      <Select
                        size="xs"
                        value={rewardChoices[claim.id] ?? 'usd'}
                        onChange={(val) =>
                          setRewardChoices((p) => ({ ...p, [claim.id]: (val ?? 'usd') as 'usd' | 'text' }))
                        }
                        data={[
                          {
                            value: 'usd',
                            label: `$${claim.reward_usd >= 1000 ? claim.reward_usd.toLocaleString('vi-VN') : claim.reward_usd}`,
                          },
                          { value: 'text', label: claim.reward_text },
                        ]}
                        allowDeselect={false}
                        styles={{
                          input: {
                            color: 'white',
                            background: 'rgba(174,62,201,0.12)',
                            borderColor: 'rgba(174,62,201,0.4)',
                            fontWeight: 700,
                          },
                        }}
                      />
                    ) : (
                      <Text fw={700} c="grape.4">
                        {claim.chosen_reward === 'text'
                          ? (claim.reward_text ?? '—')
                          : claim.chosen_reward === 'usd'
                          ? `$${claim.reward_usd >= 1000 ? claim.reward_usd.toLocaleString('vi-VN') : claim.reward_usd}`
                          : formatReward(claim.reward_usd, claim.reward_text)}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td className={styles.statusCell}>
                    <Badge color={cfg.color} variant="light" size="sm">{cfg.label}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{formatDate(claim.completed_at)}</Text>
                  </Table.Td>
                  <Table.Td>
                    {claim.status === 'not_claimed' ? (
                      <Button
                        size="xs"
                        color="grape"
                        variant="filled"
                        loading={claimingId === claim.id}
                        disabled={claimingId !== null}
                        onClick={() => handleClaim(claim.id)}
                      >
                        Nhận
                      </Button>
                    ) : (
                      <Text size="sm" c="dimmed">&mdash;</Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal
        opened={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        title="Thông tin ngân hàng"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
          Vui lòng nhập thông tin ngân hàng để nhận thưởng.
          </Text>
          <TextInput
            label="Tên ngân hàng"
            placeholder="VD: Vietcombank, BIDV, Techcombank..."
            value={bankForm.bank_name}
            onChange={(e) => setBankForm((p) => ({ ...p, bank_name: e.target.value }))}
          />
          <TextInput
            label="Số tài khoản"
            placeholder="Nhập số tài khoản ngân hàng"
            value={bankForm.account_number}
            onChange={(e) => setBankForm((p) => ({ ...p, account_number: e.target.value }))}
          />
          <TextInput
            label="Tên chủ tài khoản"
            placeholder="Nhập tên chủ tài khoản"
            value={bankForm.account_name}
            onChange={(e) => setBankForm((p) => ({ ...p, account_name: e.target.value }))}
          />
          {bankError && <Text c="red" size="sm">{bankError}</Text>}
          <Button color="grape" loading={bankSaving} onClick={handleBankSaveAndClaim} fullWidth>
            Lưu & Nhận thưởng
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
