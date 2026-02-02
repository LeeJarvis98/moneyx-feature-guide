'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Turnstile } from '@/components/Turnstile';
import styles from './LoginTab.module.css';
import { RegisterModal } from './RegisterModal';

interface LoginTabProps {
  onLoginSuccess?: (userId: string, partnerRank?: string, ownReferralId?: string, partnerType?: string) => void;
}

export function LoginTab({ onLoginSuccess }: LoginTabProps) {
  const [partnerId, setPartnerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!turnstileToken) {
      setError('Vui lòng hoàn thành xác minh bảo mật');
      return;
    }

    if (!partnerId || !password) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: partnerId,
          password,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.');
      }

      if (data.userId) {
        sessionStorage.setItem('userId', data.userId);
        
        // Store referral ID from the API response (user's referral_id from users table)
        if (data.referralId) {
          sessionStorage.setItem('referralId', data.referralId);
          console.log('[LoginTab] Stored referral ID from users table:', data.referralId);
        }
        
        // Store partner platform data if available
        if (data.partnerPlatformData) {
          sessionStorage.setItem('partnerPlatformData', JSON.stringify(data.partnerPlatformData));
        }
      }

      setSuccess(true);
      
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(data.userId, data.partnerRank || '', data.ownReferralId || '', data.partnerType || '');
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
      <div className={styles.posterSection}>
        <img 
          src="/vnclc-poster.png" 
          alt="VNCLC Poster" 
          className={styles.posterImage}
        />
      </div>
      
      <div className={styles.card}>
        <h2 className={styles.title}>Đăng nhập VNCLC</h2>
        <p className={styles.subtitle}>
          Đăng nhập vào tài khoản VNCLC của bạn
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="partnerId" className={styles.label}>
              ID VNCLC
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
              inputMode="text"
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
            <button type="button" className={`${styles.forgotLink} ${styles.buttonReset}`}>
              Quên mật khẩu?
            </button>
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

          {/* Turnstile Captcha */}
          <div className={styles.turnstileContainer}>
            <Turnstile
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || success}
          >
            {loading ? 'Đang đăng nhập' : success ? 'Thành công!' : 'Đăng nhập'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Chưa có tài khoản?{' '}
            <button
              type="button"
              className={`${styles.signUpLink} ${styles.buttonReset}`}
              onClick={() => setModalOpened(true)}
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>

      <RegisterModal isOpen={modalOpened} onClose={() => setModalOpened(false)} />
    </div>
  );
}
