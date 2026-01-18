'use client';

import { useState } from 'react';
import { exnessApi } from '@/lib/exness/api';
import styles from './PartnerLogin.module.css';

interface PartnerLoginProps {
  onLoginSuccess: () => void;
  selectedPlatform: string | null;
}

export default function PartnerLogin({ onLoginSuccess, selectedPlatform }: PartnerLoginProps) {
  const [partnerId, setPartnerId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate platform selection
    if (!selectedPlatform) {
      setError('Vui lòng chọn sàn giao dịch trước khi đăng nhập');
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
    </div>
  );
}
