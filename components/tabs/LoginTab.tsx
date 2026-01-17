'use client';

import { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Modal } from '@mantine/core';
import styles from './LoginTab.module.css';
import registerStyles from './RegisterModal.module.css';

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

  // Registration form states
  const [regPartnerId, setRegPartnerId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirmPassword, setRegShowConfirmPassword] = useState(false);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [checkingPartnerId, setCheckingPartnerId] = useState(false);
  const [partnerIdAvailable, setPartnerIdAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

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

  // Registration form validation functions
  const validatePartnerId = (value: string): boolean => {
    return /^[a-zA-Z0-9]*$/.test(value);
  };

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const passwordCriteria = {
    minLength: regPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(regPassword),
    hasLowercase: /[a-z]/.test(regPassword),
    hasNumber: /[0-9]/.test(regPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(regPassword),
  };

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = regConfirmPassword && regPassword === regConfirmPassword;
  const passwordsDontMatch = regConfirmPassword && regPassword !== regConfirmPassword;

  const handlePartnerIdChange = (value: string) => {
    if (validatePartnerId(value)) {
      setRegPartnerId(value);
      setPartnerIdAvailable(null);
      setRegError(null);
    }
  };

  const handleCheckPartnerId = async () => {
    if (!regPartnerId) {
      setRegError('Vui lòng nhập ID đối tác');
      return;
    }

    if (regPartnerId.length < 3) {
      setRegError('ID đối tác phải có ít nhất 3 ký tự');
      return;
    }

    setRegError(null);
    setCheckingPartnerId(true);
    setPartnerIdAvailable(null);

    try {
      const response = await fetch('/api/check-partner-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: regPartnerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check partner ID');
      }

      setPartnerIdAvailable(data.available);
      if (!data.available) {
        setRegError(data.message || 'ID đối tác này đã được sử dụng');
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Failed to check partner ID');
      setPartnerIdAvailable(null);
    } finally {
      setCheckingPartnerId(false);
    }
  };

  const handleEmailBlur = async () => {
    if (!regEmail || !validateEmail(regEmail)) {
      setEmailAvailable(null);
      return;
    }

    setCheckingEmail(true);
    setEmailAvailable(null);

    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check email');
      }

      setEmailAvailable(data.available);
      if (!data.available) {
        setRegError('Email này đã được đăng ký');
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Failed to check email');
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regPartnerId || !regEmail || !regPassword || !regConfirmPassword) {
      setRegError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!validatePartnerId(regPartnerId)) {
      setRegError('ID đối tác chỉ được chứa chữ cái và số');
      return;
    }

    if (!validateEmail(regEmail)) {
      setRegError('Email không hợp lệ');
      return;
    }

    if (!isPasswordStrong) {
      setRegError('Mật khẩu không đủ mạnh');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!regTermsAccepted) {
      setRegError('Vui lòng đồng ý với điều khoản dịch vụ');
      return;
    }

    setRegLoading(true);

    try {
      const response = await fetch('/api/partner-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: regPartnerId,
          email: regEmail,
          password: regPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setRegSuccess(true);
      setTimeout(() => {
        setModalOpened(false);
        // Reset registration form
        setRegPartnerId('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegTermsAccepted(false);
        setRegSuccess(false);
      }, 2000);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Đăng nhập</h2>
        <p className={styles.subtitle}>
          Đăng nhập vào tài khoản đối tác của bạn
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="partnerId" className={styles.label}>
              ID Đối tác
            </label>
            <input
              type="text"
              id="partnerId"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              required
              className={styles.input}
              placeholder="Nhập ID đối tác của bạn"
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

      {/* Registration Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        withCloseButton={false}
        size="lg"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        padding={0}
        styles={{
          content: {
            background: '#25282A',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 184, 28, 0.2)',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            overflowX: 'hidden',
          },
          body: {
            padding: 0,
          },
        }}
      >
        <div className={registerStyles.modalContent}>
          <div className={registerStyles.header}>
            <h2 className={registerStyles.title}>Đăng ký tài khoản</h2>
            <button
              onClick={() => setModalOpened(false)}
              className={registerStyles.closeButton}
              type="button"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleRegisterSubmit} className={registerStyles.form}>
            <div className={registerStyles.inputGroup}>
              <label htmlFor="regPartnerId" className={registerStyles.label}>
                ID Đối tác <span className={registerStyles.required}>*</span>
              </label>
              <div className={registerStyles.inputWithButton}>
                <input
                  type="text"
                  id="regPartnerId"
                  value={regPartnerId}
                  onChange={(e) => handlePartnerIdChange(e.target.value)}
                  required
                  className={`${registerStyles.input} ${
                    partnerIdAvailable === true
                      ? registerStyles.inputSuccess
                      : partnerIdAvailable === false
                      ? registerStyles.inputError
                      : ''
                  }`}
                  placeholder="Nhập ID đối tác của bạn"
                  disabled={regLoading || regSuccess}
                />
                <button
                  type="button"
                  onClick={handleCheckPartnerId}
                  className={registerStyles.checkButton}
                  disabled={!regPartnerId || checkingPartnerId || regLoading || regSuccess}
                >
                  {checkingPartnerId ? 'Kiểm tra...' : 'Kiểm tra'}
                </button>
              </div>
              {partnerIdAvailable === true && (
                <span className={registerStyles.successText}>
                  <Check size={16} /> ID này có sẵn
                </span>
              )}
              {partnerIdAvailable === false && (
                <span className={registerStyles.errorText}>
                  <X size={16} /> ID này đã được sử dụng
                </span>
              )}
              <span className={registerStyles.hint}>
                Chỉ chữ cái và số, ít nhất 3 ký tự
              </span>
            </div>

            <div className={registerStyles.inputGroup}>
              <label htmlFor="regEmail" className={registerStyles.label}>
                Email <span className={registerStyles.required}>*</span>
              </label>
              <input
                type="email"
                id="regEmail"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                onBlur={handleEmailBlur}
                required
                className={`${registerStyles.input} ${
                  emailAvailable === true
                    ? registerStyles.inputSuccess
                    : emailAvailable === false
                    ? registerStyles.inputError
                    : ''
                }`}
                placeholder="your@email.com"
                disabled={regLoading || regSuccess}
              />
              {checkingEmail && (
                <span className={registerStyles.hint}>Đang kiểm tra email...</span>
              )}
              {emailAvailable === false && (
                <span className={registerStyles.errorText}>
                  <X size={16} /> Email này đã được đăng ký
                </span>
              )}
            </div>

            <div className={registerStyles.inputGroup}>
              <label htmlFor="regPassword" className={registerStyles.label}>
                Mật khẩu <span className={registerStyles.required}>*</span>
              </label>
              <div className={registerStyles.passwordWrapper}>
                <input
                  type={regShowPassword ? 'text' : 'password'}
                  id="regPassword"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className={registerStyles.input}
                  placeholder="Nhập mật khẩu"
                  disabled={regLoading || regSuccess}
                />
                <button
                  type="button"
                  onClick={() => setRegShowPassword(!regShowPassword)}
                  className={registerStyles.eyeButton}
                  disabled={regLoading || regSuccess}
                >
                  {regShowPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {regPassword && (
                <div className={registerStyles.passwordCriteria}>
                  <div className={passwordCriteria.minLength ? registerStyles.criteriaValid : registerStyles.criteriaInvalid}>
                    {passwordCriteria.minLength ? <Check size={14} /> : <X size={14} />}
                    <span>Ít nhất 8 ký tự</span>
                  </div>
                  <div className={passwordCriteria.hasUppercase ? registerStyles.criteriaValid : registerStyles.criteriaInvalid}>
                    {passwordCriteria.hasUppercase ? <Check size={14} /> : <X size={14} />}
                    <span>Chữ hoa</span>
                  </div>
                  <div className={passwordCriteria.hasLowercase ? registerStyles.criteriaValid : registerStyles.criteriaInvalid}>
                    {passwordCriteria.hasLowercase ? <Check size={14} /> : <X size={14} />}
                    <span>Chữ thường</span>
                  </div>
                  <div className={passwordCriteria.hasNumber ? registerStyles.criteriaValid : registerStyles.criteriaInvalid}>
                    {passwordCriteria.hasNumber ? <Check size={14} /> : <X size={14} />}
                    <span>Số</span>
                  </div>
                  <div className={passwordCriteria.hasSpecial ? registerStyles.criteriaValid : registerStyles.criteriaInvalid}>
                    {passwordCriteria.hasSpecial ? <Check size={14} /> : <X size={14} />}
                    <span>Ký tự đặc biệt</span>
                  </div>
                </div>
              )}
            </div>

            <div className={registerStyles.inputGroup}>
              <label htmlFor="regConfirmPassword" className={registerStyles.label}>
                Xác nhận mật khẩu <span className={registerStyles.required}>*</span>
              </label>
              <div className={registerStyles.passwordWrapper}>
                <input
                  type={regShowConfirmPassword ? 'text' : 'password'}
                  id="regConfirmPassword"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  className={`${registerStyles.input} ${
                    passwordsMatch
                      ? registerStyles.inputSuccess
                      : passwordsDontMatch
                      ? registerStyles.inputError
                      : ''
                  }`}
                  placeholder="Nhập lại mật khẩu"
                  disabled={regLoading || regSuccess}
                />
                <button
                  type="button"
                  onClick={() => setRegShowConfirmPassword(!regShowConfirmPassword)}
                  className={registerStyles.eyeButton}
                  disabled={regLoading || regSuccess}
                >
                  {regShowConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordsMatch && (
                <span className={registerStyles.successText}>
                  <Check size={16} /> Mật khẩu khớp
                </span>
              )}
              {passwordsDontMatch && (
                <span className={registerStyles.errorText}>
                  <X size={16} /> Mật khẩu không khớp
                </span>
              )}
            </div>

            <div className={registerStyles.checkboxGroup}>
              <input
                type="checkbox"
                id="regTerms"
                checked={regTermsAccepted}
                onChange={(e) => setRegTermsAccepted(e.target.checked)}
                className={registerStyles.checkbox}
                disabled={regLoading || regSuccess}
              />
              <label htmlFor="regTerms" className={registerStyles.checkboxLabel}>
                Tôi đồng ý với{' '}
                <a href="#" className={registerStyles.link}>
                  điều khoản dịch vụ
                </a>{' '}
                và{' '}
                <a href="#" className={registerStyles.link}>
                  chính sách bảo mật
                </a>
              </label>
            </div>

            {regError && (
              <div className={registerStyles.error} role="alert">
                {regError}
              </div>
            )}

            {regSuccess && (
              <div className={registerStyles.success} role="status">
                Đăng ký thành công! Đang chuyển hướng...
              </div>
            )}

            <button
              type="submit"
              className={registerStyles.submitButton}
              disabled={regLoading || regSuccess || !regTermsAccepted}
            >
              {regLoading ? 'Đang đăng ký...' : regSuccess ? 'Thành công!' : 'Đăng ký'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}