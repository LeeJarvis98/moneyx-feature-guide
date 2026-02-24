'use client';

import { useState, useEffect, useRef } from 'react';
import { Stack, Card, Text, Group, Badge, Loader, Title, Divider, ThemeIcon, SimpleGrid, Modal, Button, Box, Paper, Alert } from '@mantine/core';
import { Mail, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { Turnstile, TurnstileHandle } from '@/components/Turnstile';
import classes from './ManageAccountsTab.module.css';

interface AccountRow {
  accountId: string;
  status: 'licensed' | 'unlicensed';
  licensedDate: string | null;
}

interface EmailGroup {
  email: string;
  uid: string;
  platform: string;
  accounts: AccountRow[];
}

interface AccountSummary {
  totalRegisteredEmails: number;
  totalLicensedAccounts: number;
  totalLotVolume: number;
  totalReward: number;
}

interface ManageAccountsTabProps {
  isActive?: boolean;
}

export function ManageAccountsTab({ isActive = false }: ManageAccountsTabProps) {
  const [loading, setLoading] = useState(true);
  const [emailGroups, setEmailGroups] = useState<EmailGroup[]>([]);
  const [error, setError] = useState<string>('');
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmailGroup, setSelectedEmailGroup] = useState<EmailGroup | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [accountsMarkedForDeletion, setAccountsMarkedForDeletion] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [referralId, setReferralId] = useState<string>('');
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [updateClickCount, setUpdateClickCount] = useState<Record<string, number>>({});
  const turnstileRef = useRef<TurnstileHandle>(null);

  useEffect(() => {
    if (isActive) {
      fetchOwnAccounts();
      fetchAccountSummary();
    }
  }, [isActive]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const fetchAccountSummary = async () => {
    try {
      setLoadingSummary(true);
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      if (!userId) {
        return;
      }

      const response = await fetch('/api/get-account-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account summary');
      }

      const data = await response.json();
      setAccountSummary(data.summary);
    } catch (err) {
      console.error('Error fetching account summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchOwnAccounts = async () => {
    try {
      setLoading(true);
      setError('');

      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!userId) {
        setError('Vui lòng đăng nhập để xem tài khoản');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/get-own-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account information');
      }

      const data = await response.json();
      setEmailGroups(data.licensedAccountsByEmail || []);
      setReferralId(data.referralId || '');
    } catch (err) {
      console.error('Error fetching own accounts:', err);
      setError('Không thể tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const openEmailModal = (emailGroup: EmailGroup) => {
    setSelectedEmailGroup(emailGroup);
    setSelectedAccounts([]);
    setAccountsMarkedForDeletion([]);
    setCaptchaToken('');
    setError('');
    setModalOpen(true);
  };

  const handleRefreshAccounts = async () => {
    if (!selectedEmailGroup || !captchaToken || countdown > 0) return;

    setRefreshing(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

      if (!userId) {
        setError('Vui lòng đăng nhập để cập nhật');
        return;
      }

      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          email: selectedEmailGroup.email,
          platform: selectedEmailGroup.platform,
          referralId: referralId,
          captchaToken: captchaToken,
          action: 'refresh',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh accounts');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the account list
        const updatedResponse = await fetch('/api/get-own-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          const updatedGroups = updatedData.licensedAccountsByEmail || [];
          setEmailGroups(updatedGroups);
          
          // Update the selected email group with fresh data
          const updatedEmailGroup = updatedGroups.find(
            (group: EmailGroup) => group.email === selectedEmailGroup.email && group.platform === selectedEmailGroup.platform
          );
          
          if (updatedEmailGroup) {
            setSelectedEmailGroup(updatedEmailGroup);
          }
        }
        
        // Update click count and set countdown
        const emailKey = selectedEmailGroup.email;
        const clickCount = (updateClickCount[emailKey] || 0) + 1;
        setUpdateClickCount(prev => ({ ...prev, [emailKey]: clickCount }));
        
        // First click: 10 seconds, subsequent clicks: +15 seconds each
        const delay = clickCount === 1 ? 10 : 10 + (clickCount - 1) * 15;
        setCountdown(delay);
        
        // Reset Turnstile
        turnstileRef.current?.reset();
        setCaptchaToken('');
      }
    } catch (err: any) {
      console.error('Error refreshing accounts:', err);
      setError(err.message || 'Không thể cập nhật tài khoản');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleAccountSelection = (accountId: string, status: 'licensed' | 'unlicensed') => {
    if (status === 'licensed') {
      // Handle licensed accounts - toggle for deletion
      setAccountsMarkedForDeletion((prev) => {
        if (prev.includes(accountId)) {
          return prev.filter((id) => id !== accountId);
        } else {
          return [...prev, accountId];
        }
      });
    } else {
      // Handle unlicensed accounts - toggle for licensing (max 3 total licensed)
      setSelectedAccounts((prev) => {
        if (prev.includes(accountId)) {
          return prev.filter((id) => id !== accountId);
        } else {
          // Calculate current actually licensed accounts (not just marked for deletion)
          if (!selectedEmailGroup) return prev;

          const currentLicensedCount = selectedEmailGroup.accounts.filter(
            acc => acc.status === 'licensed'
          ).length;

          const totalAfterSelection = currentLicensedCount + prev.length + 1;

          // Don't allow selection if total would exceed 3
          // User must actually delete accounts first, not just mark them
          if (totalAfterSelection > 3) {
            return prev;
          }

          return [...prev, accountId];
        }
      });
    }
  };

  const handleRevokeLicenses = async () => {
    if (!selectedEmailGroup || accountsMarkedForDeletion.length === 0) return;

    setUpdating(true);
    try {
      const revokeResponse = await fetch('/api/revoke-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: accountsMarkedForDeletion,
          email: selectedEmailGroup.email,
        }),
      });

      if (!revokeResponse.ok) {
        throw new Error('Failed to revoke licenses');
      }

      // Refresh data
      await fetchOwnAccounts();
      await fetchAccountSummary();
      setModalOpen(false);
      setSelectedAccounts([]);
      setAccountsMarkedForDeletion([]);
    } catch (err) {
      console.error('Error revoking licenses:', err);
      setError('Không thể thu hồi bản quyền');
    } finally {
      setUpdating(false);
    }
  };

  const handleGrantLicenses = async () => {
    if (!selectedEmailGroup || selectedAccounts.length === 0) return;

    setUpdating(true);
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

      if (!userId) {
        throw new Error('User ID not found');
      }

      if (!referralId) {
        throw new Error('Referral ID not found');
      }

      const grantResponse = await fetch('/api/grant-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          email: selectedEmailGroup.email,
          clientUid: selectedEmailGroup.uid,
          userId: userId,
          platform: selectedEmailGroup.platform,
          referralId: referralId,
        }),
      });

      if (!grantResponse.ok) {
        throw new Error('Failed to grant licenses');
      }

      // Refresh data
      await fetchOwnAccounts();
      await fetchAccountSummary();
      setModalOpen(false);
      setSelectedAccounts([]);
      setAccountsMarkedForDeletion([]);
    } catch (err) {
      console.error('Error granting licenses:', err);
      setError('Không thể cấp bản quyền');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" className={classes.loadingContainer}>
        <Loader size="lg" />
        <Text c="dimmed">Đang tải thông tin...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack align="center" justify="center" className={classes.loadingContainer}>
        <Text c="red">{error}</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" className={classes.container}>
      {/* Summary Cards */}
      {accountSummary && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder className={classes.summaryCard}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed" fw={500}>
                Tổng email đã đăng ký
              </Text>
              <Text size="xl" fw={700} c="white">
                {accountSummary.totalRegisteredEmails}
              </Text>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder className={classes.summaryCard}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed" fw={500}>
                Tổng ID đã cấp phép
              </Text>
              <Text size="xl" fw={700} c="white">
                {accountSummary.totalLicensedAccounts}
              </Text>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder className={classes.summaryCard}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed" fw={500}>
                Tổng khối lượng (Lô)
              </Text>
              <Text size="xl" fw={700} c="white">
                {accountSummary.totalLotVolume.toFixed(2)}
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>
      )}

      <Card shadow="sm" padding="lg" radius="md" withBorder className={classes.card}>
        <Stack gap="md">
          <Group align="center" gap="sm">
            <Title order={3} size="h4" c="white">
              Tài khoản hiện có của bạn ({emailGroups.length})
            </Title>
          </Group>

          <Divider />

          {emailGroups.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Bạn chưa có tài khoản nào
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {emailGroups.map((emailGroup, index) => {
                const licensedCount = emailGroup.accounts.filter(acc => acc.status === 'licensed').length;
                const unlicensedCount = emailGroup.accounts.filter(acc => acc.status === 'unlicensed').length;

                return (
                  <Card
                    key={index}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    className={classes.emailCard}
                    onClick={() => openEmailModal(emailGroup)}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Image
                          src={`/getbot_section/${emailGroup.platform}.png`}
                          alt={emailGroup.platform}
                          width={80}
                          height={80}
                          style={{ borderRadius: '8px', objectFit: 'contain' }}
                        />

                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text size="xs" c="dimmed">
                              Đã cấp:
                            </Text>
                            <Badge color="green" variant="filled" size="sm">
                              {licensedCount}
                            </Badge>
                          </Group>

                          {unlicensedCount > 0 && (
                            <Group justify="space-between">
                              <Text size="xs" c="dimmed">
                                Chưa cấp:
                              </Text>
                              <Badge color="blue" variant="filled" size="sm">
                                {unlicensedCount}
                              </Badge>
                            </Group>
                          )}
                        </Stack>
                      </Group>

                      <Divider />
                      <Group gap="xs">

                        <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                          <Mail size={20} />
                        </ThemeIcon>
                        <Text fw={600} size="sm" className={classes.emailText}>
                          {emailGroup.email}
                        </Text>
                      </Group>

                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Stack>
      </Card>

      {/* Account Management Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setError('');
          setCaptchaToken('');
          setCountdown(0);
        }}
        title={

          <Group gap="sm" justify="space-between">
            <Group gap="sm">
              <Badge variant="light" color="blue" tt="capitalize" size="sm">
                {selectedEmailGroup?.platform}
              </Badge>
              <Mail size={24} />
              <div>
                <Text fw={600}>{selectedEmailGroup?.email}</Text>
              </div>
            </Group>
            <Button
              leftSection={<RefreshCw size={16} />}
              onClick={handleRefreshAccounts}
              loading={refreshing}
              disabled={!captchaToken || countdown > 0 || refreshing}
              variant="light"
              color="blue"
            >
              {countdown > 0 ? `Đợi ${countdown}s` : 'Cập nhật'}
            </Button>
          </Group>
        }
        size="1400px 100px"
        centered
      >
        <Stack gap="md">
          {selectedEmailGroup && (
              <Alert
                icon={<CheckCircle size={20} />}
                color="blue"
                radius="md"
              >
                <Text size="sm">
                  <strong>UID:</strong> {selectedEmailGroup.uid}
                </Text>
              </Alert>
            )}

          {selectedEmailGroup && selectedEmailGroup.accounts.length > 0 ? (
            <Box>
              <Text size="sm" fw={600} mb="xs">
                Danh sách tài khoản (nhấn để chọn):
              </Text>

              {/* Legend */}
              <Group gap="xl" mb="sm">
                <Group gap="xs">
                  <Box className={`${classes.legendCircle} ${classes.legendViolet}`} />
                  <Text size="sm" c="dimmed">
                    ID đã cấp bản quyền
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box className={`${classes.legendCircle} ${classes.legendRed}`} />
                  <Text size="sm" c="dimmed">
                    ID được chọn để thu hồi
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box className={`${classes.legendCircle} ${classes.legendYellow}`} />
                  <Text size="sm" c="dimmed">
                    ID được chọn để cấp
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box className={`${classes.legendCircle} ${classes.legendOutline}`} />
                  <Text size="sm" c="dimmed">
                    ID khả dụng (chưa chọn)
                  </Text>
                </Group>
              </Group>

              <Paper
                withBorder
                p="md"
                radius="md"
                className={classes.accountsPaper}
              >
                <Group gap="xs">
                  {selectedEmailGroup.accounts.map((account) => {
                    const isLicensed = account.status === 'licensed';
                    const isSelected = selectedAccounts.includes(account.accountId);
                    const isMarkedForDeletion = accountsMarkedForDeletion.includes(account.accountId);

                    // Determine color and variant
                    let badgeColor = 'gray';
                    let badgeVariant: 'filled' | 'outline' = 'outline';

                    if (isMarkedForDeletion) {
                      badgeColor = 'red';
                      badgeVariant = 'filled';
                    } else if (isLicensed) {
                      badgeColor = 'violet';
                      badgeVariant = 'filled';
                    } else if (isSelected) {
                      badgeColor = '#FFB81C';
                      badgeVariant = 'filled';
                    }

                    return (
                      <Badge
                        key={account.accountId}
                        size="lg"
                        variant={badgeVariant}
                        color={badgeColor}
                        className={`${classes.accountBadge} ${(isSelected || isMarkedForDeletion) && !isLicensed ? classes.accountBadgeSelected : ''}`}
                        onClick={() => toggleAccountSelection(account.accountId, account.status)}
                        title={account.licensedDate ? `Cấp ngày: ${formatDate(account.licensedDate)}` : 'Chưa cấp bản quyền'}
                      >
                        {account.accountId}
                      </Badge>
                    );
                  })}
                </Group>
              </Paper>

              <Text size="sm" c="dimmed" mt="xs">
                Mỗi email chỉ được sử dụng tối đa <strong className={classes.highlightedStrong}>
                  {selectedEmailGroup.accounts.filter(acc => acc.status === 'licensed').length + selectedAccounts.length}/3
                </strong> ID để cấp bản quyền Bot.
              </Text>

              {accountsMarkedForDeletion.length > 0 && (
                <Alert
                  icon={<AlertCircle size={16} />}
                  color="red"
                  variant="light"
                  mt="xs"
                >
                  <Text size="sm">
                    Bạn đang chọn <strong>{accountsMarkedForDeletion.length}</strong> tài khoản để thu hồi bản quyền.
                  </Text>
                </Alert>
              )}
            </Box>
          ) : (
            <Text c="dimmed" ta="center" py="md">
              Không có tài khoản nào
            </Text>
          )}

          <Divider />

          {/* Error Alert */}
          {error && (
            <Alert
              icon={<AlertCircle size={20} />}
              color="red"
              variant="filled"
              withCloseButton
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {/* Turnstile and Update Section */}
          <Stack gap="md" align="center">
            <Turnstile
              ref={turnstileRef}
              onSuccess={(token) => setCaptchaToken(token)}
              onError={() => setCaptchaToken('')}
              onExpire={() => setCaptchaToken('')}
            />
          </Stack>

          <Divider />

          <Group justify="space-between">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={updating}
            >
              Hủy
            </Button>
            <Group gap="sm">
              {accountsMarkedForDeletion.length > 0 && (
                <Button
                  color="red"
                  onClick={handleRevokeLicenses}
                  loading={updating}
                >
                  Xóa ({accountsMarkedForDeletion.length})
                </Button>
              )}
              {selectedAccounts.length > 0 && (
                <Button
                  leftSection={<Save size={16} />}
                  onClick={handleGrantLicenses}
                  loading={updating}
                  c="black"
                >
                  Cấp bản quyền ({selectedAccounts.length})
                </Button>
              )}
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}