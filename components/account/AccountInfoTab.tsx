'use client';

import { useState, useEffect } from 'react';
import { Stack, Card, Text, Group, Badge, Loader, Title, Divider, ThemeIcon, SimpleGrid, Modal, Button, Checkbox, Box } from '@mantine/core';
import { User, Mail, Calendar, Award, CreditCard, Trash2, Save } from 'lucide-react';
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
      // Handle unlicensed accounts - toggle for licensing
      setSelectedAccounts((prev) => {
        if (prev.includes(accountId)) {
          return prev.filter((id) => id !== accountId);
        } else {
          return [...prev, accountId];
        }
      });
    }
  };

  const handleUpdateAccounts = async () => {
    if (!selectedEmailGroup) return;

    setUpdating(true);
    try {
      // Handle deletions (revoke licenses)
      if (accountsMarkedForDeletion.length > 0) {
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
      }

      // Handle new licenses (grant licenses)
      if (selectedAccounts.length > 0) {
        // Get referralId from sessionStorage or user data
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
      }

      // Refresh data
      await fetchUserInfo();
      setModalOpen(false);
      setSelectedAccounts([]);
      setAccountsMarkedForDeletion([]);
    } catch (err) {
      console.error('Error updating accounts:', err);
      setError('Không thể cập nhật tài khoản');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: '400px' }}>
        <Loader size="lg" />
        <Text c="dimmed">Đang tải thông tin...</Text>
      </Stack>
    );
  }

  if (error || !userData) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: '400px' }}>
        <Text c="red">{error || 'Không tìm thấy thông tin tài khoản'}</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" className={classes.container}>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}>
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

      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}>
        <Stack gap="md">
          <Group align="center" gap="sm">
            <Title order={3} size="h4" c="white">
              Tài khoản khách được cấp bản quyền ({emailGroups.length})
            </Title>
          </Group>

          <Divider />

          {emailGroups.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Bạn chưa có tài khoản khách nào được cấp bản quyền
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
                    style={{
                      backgroundColor: 'var(--mantine-color-dark-6)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                    onClick={() => openEmailModal(emailGroup)}
                  >
                    <Stack gap="sm">
                      <Group gap="xs">
                        <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                          <Mail size={20} />
                        </ThemeIcon>
                        <Text fw={600} size="sm" style={{ wordBreak: 'break-word' }}>
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
        size="lg"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Chọn tài khoản để cập nhật trạng thái bản quyền. Tài khoản đã cấp (màu xanh) có thể thu hồi, tài khoản chưa cấp (màu vàng) có thể cấp bản quyền.
          </Text>

          <Divider />

          {selectedEmailGroup && selectedEmailGroup.accounts.length > 0 ? (
            <Stack gap="xs">
              {selectedEmailGroup.accounts.map((account) => {
                const isLicensed = account.status === 'licensed';
                const isMarkedForDeletion = accountsMarkedForDeletion.includes(account.accountId);
                const isSelected = selectedAccounts.includes(account.accountId);
                const isChecked = isLicensed ? isMarkedForDeletion : isSelected;

                return (
                  <Box
                    key={account.accountId}
                    style={{
                      border: `2px solid ${isLicensed ? (isMarkedForDeletion ? '#fa5252' : '#51cf66') : (isSelected ? '#ffd43b' : '#373A40')}`,
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: 'var(--mantine-color-dark-6)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => toggleAccountSelection(account.accountId, account.status)}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm">
                        <Checkbox
                          checked={isChecked}
                          onChange={() => toggleAccountSelection(account.accountId, account.status)}
                          color={isLicensed ? (isMarkedForDeletion ? 'red' : 'green') : 'yellow'}
                        />
                        <div>
                          <Text fw={600} style={{ fontFamily: 'monospace' }}>
                            {account.accountId}
                          </Text>
                          {account.licensedDate && (
                            <Text size="xs" c="dimmed">
                              {formatDate(account.licensedDate)}
                            </Text>
                          )}
                        </div>
                      </Group>
                      <Badge
                        color={isLicensed ? 'green' : 'yellow'}
                        variant="filled"
                      >
                        {isLicensed ? 'Đã cấp' : 'Chưa cấp'}
                      </Badge>
                    </Group>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Text c="dimmed" ta="center" py="md">
              Không có tài khoản nào
            </Text>
          )}

          <Divider />

          <Group justify="space-between">
            <div>
              {accountsMarkedForDeletion.length > 0 && (
                <Text size="sm" c="red">
                  Thu hồi: {accountsMarkedForDeletion.length} tài khoản
                </Text>
              )}
              {selectedAccounts.length > 0 && (
                <Text size="sm" c="yellow">
                  Cấp mới: {selectedAccounts.length} tài khoản
                </Text>
              )}
            </div>
            <Group gap="sm">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={updating}
              >
                Hủy
              </Button>
              <Button
                leftSection={<Save size={16} />}
                onClick={handleUpdateAccounts}
                loading={updating}
                disabled={selectedAccounts.length === 0 && accountsMarkedForDeletion.length === 0}
              >
                Cập nhật
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
