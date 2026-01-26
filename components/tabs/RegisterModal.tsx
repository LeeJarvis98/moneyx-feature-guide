'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Turnstile } from '@/components/Turnstile';
import styles from './RegisterModal.module.css';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [regId, setRegrId] = useState('');
  const [regReferralId, setRegReferralId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirmPassword, setRegShowConfirmPassword] = useState(false);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [checkingId, setCheckingId] = useState(false);
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null);
  const [checkingReferralId, setCheckingReferralId] = useState(false);
  const [referralIdValid, setReferralIdValid] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Registration form validation functions
  const validateId = (value: string): boolean => {
    return /^[a-zA-Z0-9]*$/.test(value);
  };

  const validateReferralId = (value: string): boolean => {
    return /^[a-zA-Z0-9]+-[0-9]+$/.test(value);
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
  const isIdFormatValid = regId && validateId(regId) && regId.length >= 4;
  const isIdFormatInvalid = regId && (!validateId(regId) || regId.length < 4);
  
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
      setRegrId('');
      setRegReferralId('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegShowPassword(false);
      setRegShowConfirmPassword(false);
      setRegTermsAccepted(false);
      setRegLoading(false);
      setRegError(null);
      setRegSuccess(false);
      setCheckingId(false);
      setIdAvailable(null);
      setCheckingReferralId(false);
      setReferralIdValid(null);
      setCheckingEmail(false);
      setEmailAvailable(null);
      setIsClosing(false);
      setTurnstileToken(null);
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleIdChange = (value: string) => {
    if (validateId(value)) {
      setRegrId(value);
      // Reset availability when user modifies input
      if (idAvailable !== null) {
        setIdAvailable(null);
      }
      setRegError(null);
    }
  };

  const handleCheckId = async () => {
    if (!regId) {
      setRegError('Vui lòng nhập ID');
      return;
    }

    if (regId.length < 4) {
      setRegError('ID phải có ít nhất 4 ký tự');
      return;
    }

    if (!turnstileToken) {
      setRegError('Vui lòng hoàn thành xác minh bảo mật trước');
      return;
    }

    setRegError(null);
    setCheckingId(true);
    setIdAvailable(null);

    try {
      const response = await fetch('/api/check-user-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regId, turnstileToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check ID');
      }

      setIdAvailable(data.available);
      if (!data.available) {
        setRegError(data.message || 'ID này đã được sử dụng');
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Failed to check ID');
      setIdAvailable(null);
    } finally {
      setCheckingId(false);
    }
  };

  const handleReferralIdChange = (value: string) => {
    // Allow typing alphanumeric characters and hyphen
    if (/^[a-zA-Z0-9-]*$/.test(value)) {
      setRegReferralId(value);
      // Reset validity when user modifies input
      if (referralIdValid !== null) {
        setReferralIdValid(null);
      }
      setRegError(null);
    }
  };

  const handleCheckReferralId = async () => {
    if (!regReferralId) {
      setRegError('Vui lòng nhập ID giới thiệu');
      return;
    }

    if (regReferralId.length < 4) {
      setRegError('ID giới thiệu phải có ít nhất 4 ký tự');
      return;
    }

    if (!turnstileToken) {
      setRegError('Vui lòng hoàn thành xác minh bảo mật trước');
      return;
    }

    setRegError(null);
    setCheckingReferralId(true);
    setReferralIdValid(null);

    try {
      const response = await fetch('/api/check-referral-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_id: regReferralId, turnstileToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check referral ID');
      }

      // Check if the referral ID exists in the own_referral_id_list table
      setReferralIdValid(data.exists);
      if (!data.exists) {
        setRegError('ID giới thiệu không tồn tại trong hệ thống');
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Failed to check referral ID');
      setReferralIdValid(null);
    } finally {
      setCheckingReferralId(false);
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

    if (!turnstileToken) {
      setRegError('Vui lòng hoàn thành xác minh bảo mật trước');
      return;
    }

    setRegError(null);
    setCheckingEmail(true);
    setEmailAvailable(null);

    try {
      const response = await fetch('/api/check-user-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, turnstileToken }),
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

    if (!turnstileToken) {
      setRegError('Vui lòng hoàn thành xác minh bảo mật');
      return;
    }

    if (!regId || !regReferralId || !regEmail || !regPassword || !regConfirmPassword) {
      setRegError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!validateId(regId)) {
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
      // Get current time in GMT+7
      const now = new Date();
      const gmt7Time = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      
      const response = await fetch('/api/user-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: regId,
          referral_id: regReferralId,
          email: regEmail,
          password: regPassword,
          created_at: gmt7Time.toISOString(),
          turnstileToken,
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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setMouseDownOnOverlay(true);
        }
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && mouseDownOnOverlay) {
          handleClose();
        }
        setMouseDownOnOverlay(false);
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
            <label htmlFor="regId" className={styles.label}>
              ID<span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                id="regId"
                value={regId}
                onChange={(e) => handleIdChange(e.target.value)}
                required
                className={`${styles.input} ${
                  idAvailable === true
                    ? styles.inputSuccess
                    : idAvailable === false || isIdFormatInvalid
                    ? styles.inputError
                    : ''
                }`}
                placeholder="Nhập ID của bạn"
                disabled={regLoading || regSuccess}
              />
              <button
                type="button"
                onClick={handleCheckId}
                className={`${styles.checkButton} ${
                  idAvailable === true
                    ? styles.checkButtonVerified
                    : isIdFormatValid && idAvailable === null && !checkingId
                    ? styles.checkButtonActive
                    : ''
                }`}
                disabled={!regId || !isIdFormatValid || checkingId || regLoading || regSuccess}
              >
                {checkingId ? 'Kiểm tra...' : idAvailable === true ? '✓' : 'Kiểm tra'}
              </button>
            </div>
            {idAvailable === true && (
              <span className={styles.successText}>
                <Check size={16} /> Bạn có thể sử dụng ID này
              </span>
            )}
            {idAvailable === false && (
              <span className={styles.errorText}>
                <X size={16} /> ID này đã được sử dụng
              </span>
            )}
            {isIdFormatInvalid && idAvailable === null && (
              <span className={styles.errorText}>
                <X size={16} /> {!validateId(regId) ? 'ID chỉ được chứa chữ cái và số' : 'ID phải có ít nhất 4 ký tự'}
              </span>
            )}
            {!regId && (
              <span className={styles.hint}>
                Chỉ chữ cái và số, ít nhất 4 ký tự
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="regReferralId" className={styles.label}>
              ID giới thiệu<span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                id="regReferralId"
                value={regReferralId}
                onChange={(e) => handleReferralIdChange(e.target.value)}
                required
                className={`${styles.input} ${
                  referralIdValid === true
                    ? styles.inputSuccess
                    : referralIdValid === false
                    ? styles.inputError
                    : ''
                }`}
                placeholder="Nhập ID người giới thiệu"
                disabled={regLoading || regSuccess}
              />
              <button
                type="button"
                onClick={handleCheckReferralId}
                className={`${styles.checkButton} ${
                  referralIdValid === true
                    ? styles.checkButtonVerified
                    : regReferralId.length >= 4 && validateReferralId(regReferralId) && referralIdValid === null && !checkingReferralId
                    ? styles.checkButtonActive
                    : ''
                }`}
                disabled={!regReferralId || regReferralId.length < 4 || !validateReferralId(regReferralId) || checkingReferralId || regLoading || regSuccess}
              >
                {checkingReferralId ? 'Kiểm tra...' : referralIdValid === true ? '✓' : 'Kiểm tra'}
              </button>
            </div>
            {referralIdValid === true && (
              <span className={styles.successText}>
                <Check size={16} /> ID giới thiệu hợp lệ
              </span>
            )}
            {referralIdValid === false && (
              <span className={styles.errorText}>
                <X size={16} /> ID giới thiệu không tồn tại
              </span>
            )}
            {regReferralId && regReferralId.length < 4 && (
              <span className={styles.errorText}>
                <X size={16} /> ID phải có ít nhất 4 ký tự
              </span>
            )}
            {regReferralId && regReferralId.length >= 4 && !validateReferralId(regReferralId) && (
              <span className={styles.errorText}>
                <X size={16} /> Định dạng không đúng. Ví dụ: AndyBao24-8888
              </span>
            )}
            {!regReferralId && (
              <span className={styles.hint}>
                Định dạng: [ID]-[số]. Ví dụ: AndyBao24-8888
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

          {/* Turnstile Captcha */}
          <div className={styles.turnstileContainer}>
            <Turnstile
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
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
              idAvailable !== true || 
              referralIdValid !== true || 
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
