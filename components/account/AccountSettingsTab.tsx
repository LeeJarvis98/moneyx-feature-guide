'use client';

import { useState } from 'react';
import { Stack, Card, Text, TextInput, Button, Group, Title, Divider, Alert, PasswordInput } from '@mantine/core';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import classes from './AccountSettingsTab.module.css';

interface AccountSettingsTabProps {
  userId: string;
}

export function AccountSettingsTab({ userId }: AccountSettingsTabProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handlePasswordChange = async () => {
    // Reset messages
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Không thể cập nhật mật khẩu');
        return;
      }

      setSuccess('Mật khẩu đã được cập nhật thành công!');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Đã xảy ra lỗi khi cập nhật mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="xl" className={classes.container}>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group align="center" gap="sm">
            <Lock size={24} />
            <Title order={2} size="h3">
              Thay đổi mật khẩu
            </Title>
          </Group>

          <Divider />

          {error && (
            <Alert icon={<AlertCircle size={20} />} title="Lỗi" color="red" withCloseButton onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert icon={<CheckCircle size={20} />} title="Thành công" color="green" withCloseButton onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <PasswordInput
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            size="md"
          />

          <PasswordInput
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            size="md"
            description="Mật khẩu phải có ít nhất 6 ký tự"
          />

          <PasswordInput
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            size="md"
            error={confirmPassword && newPassword !== confirmPassword ? 'Mật khẩu không khớp' : undefined}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="filled"
              size="md"
              onClick={handlePasswordChange}
              loading={loading}
              leftSection={<Lock size={18} />}
            >
              Cập nhật mật khẩu
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3} size="h4">
            Lưu ý bảo mật
          </Title>
          <Divider />
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              • Sử dụng mật khẩu mạnh với ít nhất 6 ký tự
            </Text>
            <Text size="sm" c="dimmed">
              • Không chia sẻ mật khẩu của bạn với bất kỳ ai
            </Text>
            <Text size="sm" c="dimmed">
              • Thay đổi mật khẩu định kỳ để bảo vệ tài khoản
            </Text>
            <Text size="sm" c="dimmed">
              • Sử dụng các mật khẩu khác nhau cho các dịch vụ khác nhau
            </Text>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
