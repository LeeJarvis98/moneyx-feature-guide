'use client';

import { useState } from 'react';
import { exnessApi } from '@/lib/exness/api';
import type { ExnessApiError } from '@/types/exness';
import styles from './ExnessLogin.module.css';

interface ExnessLoginProps {
  onLoginSuccess: () => void;
}

export default function ExnessLogin({ onLoginSuccess }: ExnessLoginProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load CAPTCHA
  const loadCaptcha = async () => {
    try {
      setError(null);
      const captcha = await exnessApi.generateCaptcha();
      setCaptchaKey(captcha.key);
      setCaptchaImage(captcha.image);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Failed to load CAPTCHA');
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await exnessApi.login({
        login,
        password,
        captcha_key: captchaKey || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onLoginSuccess();
      }, 1000);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Login failed. Please check your credentials.');
      // Reload CAPTCHA on error
      if (captchaImage) {
        loadCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Exness Partner Login</h2>
        <p className={styles.subtitle}>
          Login to access your affiliate dashboard
        </p>

        <form onSubmit={handleLogin} className={styles.form}>
          {/* Login Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="login" className={styles.label}>
              Login / Email
            </label>
            <input
              type="text"
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className={styles.input}
              placeholder="partner@example.com"
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
              placeholder=""
              disabled={loading || success}
            />
          </div>

          {/* CAPTCHA Section */}
          {captchaImage ? (
            <div className={styles.captchaSection}>
              <img
                src={captchaImage}
                alt="CAPTCHA"
                className={styles.captchaImage}
              />
              <button
                type="button"
                onClick={loadCaptcha}
                className={styles.refreshButton}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={loadCaptcha}
              className={styles.loadCaptchaButton}
              disabled={loading}
            >
              Load CAPTCHA
            </button>
          )}

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
            <a
              href="https://my.exnessaffiliates.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
