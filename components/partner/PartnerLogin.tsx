'use client';

import { useState, useEffect } from 'react';
import { exnessApi } from '@/lib/exness/api';
import PartnerAside from './PartnerAside';
import CongratulationsModal from './CongratulationsModal';
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
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [registeredRank, setRegisteredRank] = useState<string>('Đồng');
  const [registeredPartnerType, setRegisteredPartnerType] = useState<'new' | 'system'>('new');
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

  // Set aside content with PartnerAside component
  useEffect(() => {
    // Get logged-in user ID from storage
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    if (userId && onAsideContentChange) {
      onAsideContentChange(
        <PartnerAside 
          partnerId={userId} 
          onRefLinksChange={setPlatformRefLinks}
        />
      );
    }

    // Clear aside content on unmount
    return () => {
      if (onAsideContentChange) {
        onAsideContentChange(null);
      }
    };
  }, [onAsideContentChange]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const response = await fetch('/api/partner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          password,
          platform: selectedPlatform,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
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
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {selectedPlatform 
            ? `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Login`
            : 'Partner Login'}
        </h2>
        <p className={styles.subtitle}>
          Login to access your partner dashboard
        </p>

        <form onSubmit={handleLogin} className={styles.form}>
          {/* ID Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="partnerId" className={styles.label}>
              {selectedPlatform 
                ? `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} ID`
                : 'Partner ID'}
            </label>
            <input
              type="text"
              id="partnerId"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              required
              className={styles.input}
              placeholder={selectedPlatform 
                ? `Enter your ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} ID`
                : 'Enter your partner ID'}
              disabled={loading || success}
              autoComplete="username"
              inputMode="text"
            />
          </div>

          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="Enter your password"
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
              Login successful! Redirecting...
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || success}
          >
            {loading ? 'Logging in…' : success ? 'Success!' : 'Login'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Connect directly with your Exness partner account credentials
          </p>
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
