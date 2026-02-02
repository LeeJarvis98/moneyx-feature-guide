'use client';

import { useState, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import { exnessApi } from '@/lib/exness/api';
import PartnerAside from './PartnerAside';
import CongratulationsModal from './CongratulationsModal';
import { Turnstile } from '@/components/Turnstile';
import styles from './PartnerLogin.module.css';

interface PartnerLoginProps {
  onLoginSuccess: () => void;
  selectedPlatform: string | null;
  onAsideContentChange?: (content: React.ReactNode) => void;
}

interface PlatformRefLinks {
  exness: string;
  binance: string;
  bingx: string;
  bitget: string;
  bybit: string;
  gate: string;
  htx: string;
  kraken: string;
  kucoin: string;
  mexc: string;
  okx: string;
  upbit: string;
}

export default function PartnerLogin({ onLoginSuccess, selectedPlatform, onAsideContentChange }: PartnerLoginProps) {
  const [partnerId, setPartnerId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [registeredRank, setRegisteredRank] = useState<string>('Đồng');
  const [registeredPartnerType, setRegisteredPartnerType] = useState<'new' | 'system'>('new');
  const [userId, setUserId] = useState<string | null>(null);
  const [platformRefLinks, setPlatformRefLinks] = useState<PlatformRefLinks>({
    exness: '',
    binance: '',
    bingx: '',
    bitget: '',
    bybit: '',
    gate: '',
    htx: '',
    kraken: '',
    kucoin: '',
    mexc: '',
    okx: '',
    upbit: '',
  });

  // Get userId from storage after component mounts (client-side only)
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    setUserId(storedUserId);
  }, []);

  // Check if user just registered and show congratulations modal
  useEffect(() => {
    const justRegistered = sessionStorage.getItem('justRegistered');
    const rank = localStorage.getItem('partnerRank');
    const partnerType = sessionStorage.getItem('registeredPartnerType') as 'new' | 'system' | null;

    if (justRegistered === 'true' && rank && partnerType) {
      setRegisteredRank(rank);
      setRegisteredPartnerType(partnerType);
      setShowCongratulations(true);
      // Clear the flag
      sessionStorage.removeItem('justRegistered');
    }
  }, []);

  // Stable handler for ref links changes
  const handleRefLinksChange = useCallback((refLinks: PlatformRefLinks) => {
    setPlatformRefLinks(refLinks);
  }, []);

  // Set aside content with PartnerAside component
  useEffect(() => {
    if (userId && onAsideContentChange) {
      onAsideContentChange(
        <PartnerAside
          partnerId={userId}
          onRefLinksChange={handleRefLinksChange}
        />
      );
    }

    // Clear aside content on unmount
    return () => {
      if (onAsideContentChange) {
        onAsideContentChange(null);
      }
    };
  }, [userId, onAsideContentChange, handleRefLinksChange]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate turnstile token
    if (!turnstileToken) {
      setError('Vui lòng hoàn thành xác minh bảo mật');
      return;
    }

    // Validate platform selection
    if (!selectedPlatform) {
      setError('Vui lòng chọn sàn giao dịch trước khi đăng nhập');
      return;
    }

    // Check if platform has a referral link
    const platformRefLink = platformRefLinks[selectedPlatform as keyof PlatformRefLinks];
    if (!platformRefLink || platformRefLink.trim() === '') {
      setError(`Vui lòng thêm link giới thiệu cho ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} trước khi đăng nhập`);
      return;
    }

    setLoading(true);

    try {
      // Get logged-in user ID from storage
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add user ID header if available
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const response = await fetch('/api/partner-login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          partnerId,
          password,
          platform: selectedPlatform,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.');
      }

      // Store partner info in session storage or context
      if (data.partnerId) {
        sessionStorage.setItem('partnerId', data.partnerId);
      }
      if (data.platformToken) {
        exnessApi.setToken(data.platformToken);
      }

      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess();
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
        <h2 className={styles.title}>
          {selectedPlatform
            ? `Đăng nhập ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}`
            : 'Đăng nhập Đối tác'}
        </h2>

        <div className={styles.noticeBox}>
          <div className={styles.noticeHeader}>
            <Info className={styles.noticeIcon} size={20} />
            <h3 className={styles.noticeTitle}>Thông tin quan trọng</h3>
          </div>

          <p className={styles.noticeText}>
            Mục đích của bước này là xác nhận liên kết API cho hệ thống tự động của bạn.
          </p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {/* ID Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="partnerId" className={styles.label}>
              {selectedPlatform
                ? `ID ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}`
                : 'ID Đối tác'}
            </label>
            <input
              type="text"
              id="partnerId"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              required
              className={styles.input}
              placeholder={selectedPlatform
                ? `Nhập ID Đối tác ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} của bạn`
                : 'Nhập ID Đối tác của bạn'}
              disabled={loading || success}
              autoComplete="username"
              inputMode="text"
            />
          </div>

          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="Nhập mật khẩu của bạn"
              disabled={loading || success}
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className={styles.success} role="status">
              Đăng nhập thành công! Đang chuyển hướng...
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || success}
          >
            {loading ? 'Đang đăng nhập…' : success ? 'Thành công!' : 'Đăng nhập'}
          </button>
        </form>

        {/* Turnstile Captcha */}
        <div className={styles.footer}>
          <Turnstile
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />
        </div>
      </div>

      {/* Congratulations Modal */}
      {showCongratulations && (
        <CongratulationsModal
          rank={registeredRank}
          partnerType={registeredPartnerType}
          onNavigateToLogin={() => {
            // Already on login page, just update badge
            const rank = localStorage.getItem('partnerRank');
            if (rank) {
              window.dispatchEvent(new CustomEvent('partnerRankUpdated', {
                detail: { rank }
              }));
            }
          }}
          onClose={() => {
            setShowCongratulations(false);
            // Trigger badge update when modal closes
            const rank = localStorage.getItem('partnerRank');
            if (rank) {
              window.dispatchEvent(new CustomEvent('partnerRankUpdated', {
                detail: { rank }
              }));
            }
          }}
        />
      )}
    </div>
  );
}
