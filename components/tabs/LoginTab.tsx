'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './LoginTab.module.css';
import { RegisterModal } from './RegisterModal';

interface LoginTabProps {
  onLoginSuccess?: () => void;
}

export function LoginTab({ onLoginSuccess }: LoginTabProps) {
  const [partnerId, setPartnerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partnerId || !password) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/partner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.');
      }

      if (data.partnerId) {
        if (rememberMe) {
          localStorage.setItem('partnerId', data.partnerId);
        } else {
          sessionStorage.setItem('partnerId', data.partnerId);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Đăng nhập</h2>
        <p className={styles.subtitle}>
          Đăng nhập vào tài khoản của bạn
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="partnerId" className={styles.label}>
              ID
            </label>
            <input
              type="text"
              id="partnerId"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              required
              className={styles.input}
              placeholder="Nhập ID của bạn"
              disabled={loading || success}
              autoComplete="username"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Mật khẩu
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Nhập mật khẩu"
                disabled={loading || success}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeButton}
                disabled={loading || success}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.optionsRow}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
                disabled={loading || success}
              />
              <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                Ghi nhớ đăng nhập
              </label>
            </div>
            <a href="#" className={styles.forgotLink}>
              Quên mật khẩu?
            </a>
          </div>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className={styles.success} role="status">
              Đăng nhập thành công! Đang chuyển hướng...
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || success}
          >
            {loading ? 'Đang đăng nhập...' : success ? 'Thành công!' : 'Đăng nhập'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Chưa có tài khoản?{' '}
            <a
              href="#"
              className={styles.signUpLink}
              onClick={(e) => {
                e.preventDefault();
                setModalOpened(true);
              }}
            >
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>

      <RegisterModal isOpen={modalOpened} onClose={() => setModalOpened(false)} />
    </div>
  );
}