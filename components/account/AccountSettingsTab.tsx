'use client';

import { useState } from 'react';
import { Stack, Card, Text, TextInput, Button, Group, Title, Divider, Alert, PasswordInput } from '@mantine/core';
import { Lock, AlertCircle, CheckCircle, Check, X } from 'lucide-react';
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

  const passwordCriteria = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = confirmPassword && newPassword === confirmPassword;
  const passwordsDontMatch = confirmPassword && newPassword !== confirmPassword;

  const handlePasswordChange = async () => {
    // Reset messages
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    if (!isPasswordStrong) {
      setError('Mật khẩu mới không đủ mạnh');
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
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}>
        <Stack gap="md">
          <Group align="center" gap="sm">
            <Lock size={24} />
            <Title order={2} size="h3" c="white">
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
            className={classes.glowInput}
            error={
              !currentPassword && error
                ? 'Vui lòng nhập mật khẩu hiện tại'
                : currentPassword && newPassword && currentPassword === newPassword
                ? 'Mật khẩu mới phải khác mật khẩu hiện tại'
                : undefined
            }
          />

          <PasswordInput
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            size="md"
            description="Mật khẩu phải có ít nhất 8 ký tự"
            className={classes.glowInput}
            error={newPassword && !isPasswordStrong ? 'Mật khẩu chưa đủ mạnh' : undefined}
          />

          <div className={passwordsMatch ? classes.inputSuccess : ''}>
            <PasswordInput
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              size="md"
              error={passwordsDontMatch ? 'Mật khẩu không khớp' : undefined}
              className={classes.glowInput}
            />
          </div>

          {passwordsMatch && (
            <Text size="sm" c="green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={16} /> Mật khẩu khớp
            </Text>
          )}

          {newPassword && (
            <div className={classes.passwordCriteria}>
              <Text size="sm" fw={600} mb="xs">
                Mật khẩu phải chứa:
              </Text>
              <div className={passwordCriteria.minLength ? classes.criteriaValid : classes.criteriaInvalid}>
                {passwordCriteria.minLength ? <Check size={14} /> : <X size={14} />}
                <span>Ít nhất 8 ký tự</span>
              </div>
              <div className={passwordCriteria.hasUppercase ? classes.criteriaValid : classes.criteriaInvalid}>
                {passwordCriteria.hasUppercase ? <Check size={14} /> : <X size={14} />}
                <span>Một chữ cái viết hoa (A-Z)</span>
              </div>
              <div className={passwordCriteria.hasLowercase ? classes.criteriaValid : classes.criteriaInvalid}>
                {passwordCriteria.hasLowercase ? <Check size={14} /> : <X size={14} />}
                <span>Một chữ cái viết thường (a-z)</span>
              </div>
              <div className={passwordCriteria.hasNumber ? classes.criteriaValid : classes.criteriaInvalid}>
                {passwordCriteria.hasNumber ? <Check size={14} /> : <X size={14} />}
                <span>Một chữ số (0-9)</span>
              </div>
              <div className={passwordCriteria.hasSpecial ? classes.criteriaValid : classes.criteriaInvalid}>
                {passwordCriteria.hasSpecial ? <Check size={14} /> : <X size={14} />}
                <span>Một ký tự đặc biệt (!@#$%^&*...)</span>
              </div>
            </div>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="filled"
              size="md"
              onClick={handlePasswordChange}
              loading={loading}
              leftSection={<Lock size={18} />}
              className={classes.glowButton}
              c="black"
              fullWidth
              disabled={
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                !isPasswordStrong ||
                !passwordsMatch ||
                loading
              }
            >
              Cập nhật mật khẩu
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
