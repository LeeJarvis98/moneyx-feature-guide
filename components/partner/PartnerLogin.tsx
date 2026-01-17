'use client';

import { useState } from 'react';
import { exnessApi } from '@/lib/exness/api';
import styles from './PartnerLogin.module.css';
import SignUpModal from './SignUpModal';

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
  const [showSignUpModal, setShowSignUpModal] = useState(false);

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
        <h2 className={styles.title}>Partner Login</h2>
        <p className={styles.subtitle}>
          Login to access your partner dashboard
        </p>

        <form onSubmit={handleLogin} className={styles.form}>
          {/* Partner ID Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="partnerId" className={styles.label}>
              Partner ID
            </label>
            <input
              type="text"
              id="partnerId"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              required
              className={styles.input}
              placeholder="Enter your partner ID"
              disabled={loading || success}
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
            {loading ? 'Logging in...' : success ? 'Success!' : 'Login'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setShowSignUpModal(true)}
              className={styles.link}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>

      {showSignUpModal && (
        <SignUpModal onClose={() => setShowSignUpModal(false)} />
      )}
    </div>
  );
}
