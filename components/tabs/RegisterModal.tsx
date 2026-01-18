'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import styles from './RegisterModal.module.css';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [isClosing, setIsClosing] = useState(false);
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
  
  // ID validation states
  const isIdFormatValid = regPartnerId && validatePartnerId(regPartnerId) && regPartnerId.length >= 4;
  const isIdFormatInvalid = regPartnerId && (!validatePartnerId(regPartnerId) || regPartnerId.length < 4);
  
  // Email validation states with common TLD mistake detection
  const hasCommonTLDMistake = regEmail && (
    regEmail.endsWith('@gmail.co') ||
    regEmail.endsWith('@yahoo.co') ||
    regEmail.endsWith('@hotmail.co') ||
    regEmail.endsWith('@outlook.co') ||
    /\.(co|cm|con|comm)$/.test(regEmail) // catch .co, .cm, .con, .comm at the end
  );
  const isEmailFormatValid = regEmail && validateEmail(regEmail) && !hasCommonTLDMistake;
  const isEmailFormatInvalid = regEmail && (!validateEmail(regEmail) || hasCommonTLDMistake);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all form fields when modal closes
      setRegPartnerId('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegShowPassword(false);
      setRegShowConfirmPassword(false);
      setRegTermsAccepted(false);
      setRegLoading(false);
      setRegError(null);
      setRegSuccess(false);
      setCheckingPartnerId(false);
      setPartnerIdAvailable(null);
      setCheckingEmail(false);
      setEmailAvailable(null);
      setIsClosing(false);
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handlePartnerIdChange = (value: string) => {
    if (validatePartnerId(value)) {
      setRegPartnerId(value);
      // Reset availability when user modifies input
      if (partnerIdAvailable !== null) {
        setPartnerIdAvailable(null);
      }
      setRegError(null);
    }
  };

  const handleCheckPartnerId = async () => {
    if (!regPartnerId) {
      setRegError('Vui lòng nhập ID');
      return;
    }

    if (regPartnerId.length < 4) {
      setRegError('ID phải có ít nhất 4 ký tự');
      return;
    }

    setRegError(null);
    setCheckingPartnerId(true);
    setPartnerIdAvailable(null);

    try {
      const response = await fetch('/api/check-user-id', {
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
        setRegError(data.message || 'ID này đã được sử dụng');
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Failed to check partner ID');
      setPartnerIdAvailable(null);
    } finally {
      setCheckingPartnerId(false);
    }
  };

  const handleCheckEmail = async () => {
    if (!regEmail) {
      setRegError('Vui lòng nhập email');
      return;
    }

    if (!validateEmail(regEmail)) {
      setRegError('Email không hợp lệ');
      return;
    }

    setRegError(null);
    setCheckingEmail(true);
    setEmailAvailable(null);

    try {
      const response = await fetch('/api/check-user-email', {
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
        setRegError(data.message || 'Email này đã được đăng ký');
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
      setRegError('ID chỉ được chứa chữ cái và số');
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
      const response = await fetch('/api/user-signup', {
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
        handleClose();
      }, 2000);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className={`${styles.modal} ${isClosing ? styles.modalClosing : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Đăng ký tài khoản</h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            type="button"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRegisterSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="regPartnerId" className={styles.label}>
              ID<span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                id="regPartnerId"
                value={regPartnerId}
                onChange={(e) => handlePartnerIdChange(e.target.value)}
                required
                className={`${styles.input} ${
                  partnerIdAvailable === true
                    ? styles.inputSuccess
                    : partnerIdAvailable === false || isIdFormatInvalid
                    ? styles.inputError
                    : ''
                }`}
                placeholder="Nhập ID của bạn"
                disabled={regLoading || regSuccess}
              />
              <button
                type="button"
                onClick={handleCheckPartnerId}
                className={`${styles.checkButton} ${
                  partnerIdAvailable === true
                    ? styles.checkButtonVerified
                    : isIdFormatValid && partnerIdAvailable === null && !checkingPartnerId
                    ? styles.checkButtonActive
                    : ''
                }`}
                disabled={!regPartnerId || !isIdFormatValid || checkingPartnerId || regLoading || regSuccess}
              >
                {checkingPartnerId ? 'Kiểm tra...' : partnerIdAvailable === true ? '✓' : 'Kiểm tra'}
              </button>
            </div>
            {partnerIdAvailable === true && (
              <span className={styles.successText}>
                <Check size={16} /> Bạn có thể sử dụng ID này
              </span>
            )}
            {partnerIdAvailable === false && (
              <span className={styles.errorText}>
                <X size={16} /> ID này đã được sử dụng
              </span>
            )}
            {isIdFormatInvalid && partnerIdAvailable === null && (
              <span className={styles.errorText}>
                <X size={16} /> {!validatePartnerId(regPartnerId) ? 'ID chỉ được chứa chữ cái và số' : 'ID phải có ít nhất 4 ký tự'}
              </span>
            )}
            {!regPartnerId && (
              <span className={styles.hint}>
                Chỉ chữ cái và số, ít nhất 4 ký tự
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="regEmail" className={styles.label}>
              Email <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithButton}>
              <input
                type="email"
                id="regEmail"
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  // Reset availability when user modifies input
                  if (emailAvailable !== null) {
                    setEmailAvailable(null);
                  }
                  setRegError(null);
                }}
                required
                className={`${styles.input} ${
                  emailAvailable === true
                    ? styles.inputSuccess
                    : emailAvailable === false || isEmailFormatInvalid
                    ? styles.inputError
                    : ''
                }`}
                placeholder="your@email.com"
                disabled={regLoading || regSuccess}
              />
              <button
                type="button"
                onClick={handleCheckEmail}
                className={`${styles.checkButton} ${
                  emailAvailable === true
                    ? styles.checkButtonVerified
                    : isEmailFormatValid && emailAvailable === null && !checkingEmail
                    ? styles.checkButtonActive
                    : ''
                }`}
                disabled={!regEmail || !isEmailFormatValid || checkingEmail || regLoading || regSuccess}
              >
                {checkingEmail ? 'Kiểm tra...' : emailAvailable === true ? '✓' : 'Kiểm tra'}
              </button>
            </div>
            {emailAvailable === true && (
              <span className={styles.successText}>
                <Check size={16} /> Bạn có thể sử dụng email này
              </span>
            )}
            {emailAvailable === false && (
              <span className={styles.errorText}>
                <X size={16} /> Email này đã được đăng ký
              </span>
            )}
            {isEmailFormatInvalid && emailAvailable === null && (
              <span className={styles.errorText}>
                <X size={16} /> {hasCommonTLDMistake ? 'Định dạng email không đúng (bạn có thể đã nhập nhầm .com thành .co)' : 'Định dạng email không hợp lệ'}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className={styles.inputGroup}>
              <label htmlFor="regPassword" className={styles.label}>
                Mật khẩu <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={regShowPassword ? 'text' : 'password'}
                  id="regPassword"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="Nhập mật khẩu"
                  disabled={regLoading || regSuccess}
                />
                <button
                  type="button"
                  onClick={() => setRegShowPassword(!regShowPassword)}
                  className={styles.eyeButton}
                  disabled={regLoading || regSuccess}
                >
                  {regShowPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="regConfirmPassword" className={styles.label}>
                Xác nhận mật khẩu <span className={styles.required}>*</span>
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={regShowConfirmPassword ? 'text' : 'password'}
                  id="regConfirmPassword"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  className={`${styles.input} ${
                    passwordsMatch
                      ? styles.inputSuccess
                      : passwordsDontMatch
                      ? styles.inputError
                      : ''
                  }`}
                  placeholder="Nhập lại mật khẩu"
                  disabled={regLoading || regSuccess}
                />
                <button
                  type="button"
                  onClick={() => setRegShowConfirmPassword(!regShowConfirmPassword)}
                  className={styles.eyeButton}
                  disabled={regLoading || regSuccess}
                >
                  {regShowConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordsMatch && (
                <span className={styles.successText}>
                  <Check size={16} /> Mật khẩu khớp
                </span>
              )}
              {passwordsDontMatch && (
                <span className={styles.errorText}>
                  <X size={16} /> Mật khẩu không khớp
                </span>
              )}
            </div>
          </div>

          {regPassword && (
            <div className={styles.passwordCriteria}>
               <p className={styles.criteriaTitle}>Mật khẩu phải chứa:</p>
              <div className={passwordCriteria.minLength ? styles.criteriaValid : styles.criteriaInvalid}>
                {passwordCriteria.minLength ? <Check size={14} /> : <X size={14} />}
                <span>Ít nhất 8 ký tự</span>
              </div>
              <div className={passwordCriteria.hasUppercase ? styles.criteriaValid : styles.criteriaInvalid}>
                {passwordCriteria.hasUppercase ? <Check size={14} /> : <X size={14} />}
                <span>Một chữ cái viết hoa (A-Z)</span>
              </div>
              <div className={passwordCriteria.hasLowercase ? styles.criteriaValid : styles.criteriaInvalid}>
                {passwordCriteria.hasLowercase ? <Check size={14} /> : <X size={14} />}
                <span>Một chữ cái viết thường (a-z)</span>
              </div>
              <div className={passwordCriteria.hasNumber ? styles.criteriaValid : styles.criteriaInvalid}>
                {passwordCriteria.hasNumber ? <Check size={14} /> : <X size={14} />}
                <span>Một chữ số (0-9)</span>
              </div>
              <div className={passwordCriteria.hasSpecial ? styles.criteriaValid : styles.criteriaInvalid}>
                {passwordCriteria.hasSpecial ? <Check size={14} /> : <X size={14} />}
                <span>Một ký tự đặc biệt (!@#$%^&*...)</span>
              </div>
            </div>
          )}

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="regTerms"
              checked={regTermsAccepted}
              onChange={(e) => setRegTermsAccepted(e.target.checked)}
              className={styles.checkbox}
              disabled={regLoading || regSuccess}
            />
            <label htmlFor="regTerms" className={styles.checkboxLabel}>
              Tôi đồng ý với{' '}
              <a href="#" className={styles.link}>
                điều khoản dịch vụ
              </a>{' '}
              và{' '}
              <a href="#" className={styles.link}>
                chính sách bảo mật
              </a>
            </label>
          </div>

          {regError && (
            <div className={styles.error} role="alert">
              {regError}
            </div>
          )}

          {regSuccess && (
            <div className={styles.success} role="status">
              Đăng ký thành công! Đang chuyển hướng...
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={
              regLoading || 
              regSuccess || 
              !regTermsAccepted || 
              partnerIdAvailable !== true || 
              emailAvailable !== true || 
              !isPasswordStrong || 
              !passwordsMatch
            }
          >
            {regLoading ? 'Đang đăng ký...' : regSuccess ? 'Thành công!' : 'Đăng ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
