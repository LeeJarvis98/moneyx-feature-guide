'use client';

import { useState, useEffect } from 'react';
import { Stack, Card, Text, Group, Badge, Loader, Title, Divider, ThemeIcon, SimpleGrid, Modal, Button, Box, Paper, Alert } from '@mantine/core';
import { User, Mail, Calendar, Award, CreditCard, Save, CheckCircle, AlertCircle } from 'lucide-react';
import classes from './AccountInfoTab.module.css';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  partner_rank: string;
  referral_id: string;
  status: string;
}

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

interface AccountInfoTabProps {
  userId: string;
}

export function AccountInfoTab({ userId }: AccountInfoTabProps) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [emailGroups, setEmailGroups] = useState<EmailGroup[]>([]);
  const [error, setError] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmailGroup, setSelectedEmailGroup] = useState<EmailGroup | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [accountsMarkedForDeletion, setAccountsMarkedForDeletion] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, [userId]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/get-user-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user information');
      }

      const data = await response.json();
      setUserData(data.user);
      setEmailGroups(data.licensedAccountsByEmail || []);
    } catch (err) {
      console.error('Error fetching user info:', err);
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
    setModalOpen(true);
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
      // Handle unlicensed accounts - toggle for licensing (max 3)
      setSelectedAccounts((prev) => {
        if (prev.includes(accountId)) {
          return prev.filter((id) => id !== accountId);
        } else {
          // Limit to 3 selections
          if (prev.length >= 3) {
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
      await fetchUserInfo();
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
      // Get referralId from user data
      const referralId = userData?.referral_id;
      
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
      await fetchUserInfo();
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

  if (error || !userData) {
    return (
      <Stack align="center" justify="center" className={classes.loadingContainer}>
        <Text c="red">{error || 'Không tìm thấy thông tin tài khoản'}</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" className={classes.container}>
      <Card shadow="sm" padding="lg" radius="md" withBorder className={classes.card}>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={2} size="h3" c="white">
              Thông tin tài khoản
            </Title>
            <Badge
              color={userData.status === 'active' ? 'green' : 'red'}
              variant="filled"
              size="lg"
            >
              {userData.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
            </Badge>
          </Group>

          <Divider />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Group gap="md" align="flex-start">
              <ThemeIcon size="xl" radius="md" variant="light" color="yellow">
                <User size={24} />
              </ThemeIcon>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  ID người dùng
                </Text>
                <Text fw={600} size="lg">
                  {userData.id}
                </Text>
              </Stack>
            </Group>

            <Group gap="md" align="flex-start">
              <ThemeIcon size="xl" radius="md" variant="light" color="yellow">
                <Mail size={24} />
              </ThemeIcon>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Email
                </Text>
                <Text fw={600} size="lg">
                  {userData.email}
                </Text>
              </Stack>
            </Group>

            <Group gap="md" align="flex-start">
              <ThemeIcon size="xl" radius="md" variant="light" color="yellow">
                <CreditCard size={24} />
              </ThemeIcon>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Mã giới thiệu
                </Text>
                <Text fw={600} size="lg">
                  {userData.referral_id}
                </Text>
              </Stack>
            </Group>

            <Group gap="md" align="flex-start">
              <ThemeIcon size="xl" radius="md" variant="light" color="yellow">
                <Award size={24} />
              </ThemeIcon>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Cấp bậc đối tác
                </Text>
                <Text fw={600} size="lg">
                  {userData.partner_rank === 'None' ? 'Chưa là đối tác' : userData.partner_rank}
                </Text>
              </Stack>
            </Group>

            <Group gap="md" align="flex-start">
              <ThemeIcon size="xl" radius="md" variant="light" color="yellow">
                <Calendar size={24} />
              </ThemeIcon>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  Ngày tạo tài khoản
                </Text>
                <Text fw={600} size="lg">
                  {formatDate(userData.created_at)}
                </Text>
              </Stack>
            </Group>
          </SimpleGrid>
        </Stack>
      </Card>

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
              Bạn chưa có tài khoản nào được cấp bản quyền
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
                      <Group gap="xs">
                        <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                          <Mail size={20} />
                        </ThemeIcon>
                        <Text fw={600} size="sm" className={classes.emailText}>
                          {emailGroup.email}
                        </Text>
                      </Group>
                      
                      <Badge variant="light" color="blue" tt="capitalize">
                        {emailGroup.platform}
                      </Badge>

                      <Divider />

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
                          <Badge color="yellow" variant="filled" size="sm">
                            {unlicensedCount}
                          </Badge>
                        </Group>
                      )}
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
        onClose={() => setModalOpen(false)}
        title={
          <Group gap="sm">
            <Mail size={24} />
            <div>
              <Text fw={600}>{selectedEmailGroup?.email}</Text>
              <Badge variant="light" color="blue" tt="capitalize" size="sm">
                {selectedEmailGroup?.platform}
              </Badge>
            </div>
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

          <Divider />

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
              
              {selectedAccounts.length > 0 && (
                <Text size="sm" c="dimmed" mt="xs">
                  Mỗi email chỉ được sử dụng tối đa <strong className={classes.highlightedStrong}>{selectedAccounts.length}/3</strong> ID để cấp bản quyền Bot.
                </Text>
              )}

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
                  disabled={accountsMarkedForDeletion.length === 0}
                >
                  Xóa ({accountsMarkedForDeletion.length})
                </Button>
              )}
              {selectedAccounts.length > 0 && (
                <Button
                  leftSection={<Save size={16} />}
                  onClick={handleGrantLicenses}
                  loading={updating}
                  disabled={selectedAccounts.length === 0}
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
