'use client';

import { useState, useEffect } from 'react';
import { Stack, Card, Text, Group, Badge, Loader, Table, Title, Divider, ThemeIcon, SimpleGrid } from '@mantine/core';
import { User, Mail, Calendar, Award, Shield, CreditCard } from 'lucide-react';
import classes from './AccountInfoTab.module.css';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  partner_rank: string;
  referral_id: string;
  status: string;
}

interface LicensedAccount {
  account_id: string;
  email: string;
  platform: string | null;
  licensed_date: string;
}

interface AccountInfoTabProps {
  userId: string;
}

export function AccountInfoTab({ userId }: AccountInfoTabProps) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [licensedAccounts, setLicensedAccounts] = useState<LicensedAccount[]>([]);
  const [error, setError] = useState<string>('');

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
      setLicensedAccounts(data.licensedAccounts);
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
              Tài khoản khách được cấp bản quyền ({licensedAccounts.length})
            </Title>
          </Group>

          <Divider />

          {licensedAccounts.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Bạn chưa có tài khoản khách nào được cấp bản quyền
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Nền tảng</Table.Th>
                  <Table.Th>Ngày cấp bản quyền</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {licensedAccounts.map((account, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Text fw={600} style={{ fontFamily: 'monospace' }}>
                        {account.account_id}
                      </Text>
                    </Table.Td>
                    <Table.Td>{account.email}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {account.platform || 'N/A'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(account.licensed_date)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
