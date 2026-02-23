'use client';

import { useState, useEffect } from 'react';
import { X, Mail, CheckCircle } from 'lucide-react';
import { Turnstile } from '@/components/Turnstile';
import styles from './ForgotPasswordModal.module.css';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError(null);
      setSuccess(false);
      setLoading(false);
      setTurnstileToken(null);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMouseDownOnOverlay(true);
    }
  };

  const handleOverlayMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownOnOverlay) {
      handleClose();
    }
    setMouseDownOnOverlay(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!turnstileToken) {
      setError('Vui lòng hoàn thành xác minh bảo mật');
      return;
    }

    if (!email) {
      setError('Vui lòng nhập email của bạn');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ''}`}
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div className={`${styles.modal} ${isClosing ? styles.modalClosing : ''}`}>
        <button
          type="button"
          onClick={handleClose}
          className={styles.closeButton}
          disabled={loading}
          aria-label="Đóng"
        >
          <X size={24} />
        </button>

        <div className={styles.header}>
          <Mail className={styles.headerIcon} size={48} />
          <h2 className={styles.title}>Quên mật khẩu</h2>
          <p className={styles.subtitle}>
            Nhập email của bạn để nhận mật khẩu mới
          </p>
        </div>

        {success ? (
          <div className={styles.successContainer}>
            <CheckCircle className={styles.successIcon} size={64} />
            <h3 className={styles.successTitle}>Thành công!</h3>
            <p className={styles.successMessage}>
              Mật khẩu mới đã được gửi đến email của bạn.
              <br />
              <strong>Vui lòng kiểm tra hộp thư và đổi mật khẩu sau khi đăng nhập.</strong>
            </p>
            <button
              type="button"
              onClick={handleClose}
              className={styles.closeSuccessButton}
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="forgot-email" className={styles.label}>
                Email
              </label>
              <input
                type="email"
                id="forgot-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="Nhập email đã đăng ký"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {error && (
              <div className={styles.error} role="alert">
                {error}
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
              disabled={loading || !turnstileToken}
            >
              {loading ? 'Đang xử lý...' : 'Gửi mật khẩu mới'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}