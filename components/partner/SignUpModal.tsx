'use client';

import { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import styles from './SignUpModal.module.css';

interface SignUpModalProps {
  onClose: () => void;
}

interface PlatformCredentials {
  platform: string;
  username: string;
  password: string;
  url: string;
  verified: boolean;
}

export default function SignUpModal({ onClose }: SignUpModalProps) {
  const [partnerId, setPartnerId] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credentialsList, setCredentialsList] = useState<PlatformCredentials[]>([
    {
      platform: 'exness',
      username: '',
      password: '',
      url: '',
      verified: false,
    },
  ]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingCredentials, setCheckingCredentials] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);
  const [checkingPartnerId, setCheckingPartnerId] = useState(false);
  const [partnerIdAvailable, setPartnerIdAvailable] = useState<boolean | null>(null);

  // Check if passwords match
  const passwordsMatch = confirmPassword && partnerPassword === confirmPassword;
  const passwordsDontMatch = confirmPassword && partnerPassword !== confirmPassword;

  // Validate Partner ID (only alphanumeric characters)
  const validatePartnerId = (value: string): boolean => {
    return /^[a-zA-Z0-9]*$/.test(value);
  };

  // Validate URL format
  const validateUrl = (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  // Password validation criteria
  const passwordCriteria = {
    minLength: partnerPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(partnerPassword),
    hasLowercase: /[a-z]/.test(partnerPassword),
    hasNumber: /[0-9]/.test(partnerPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(partnerPassword),
  };

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);

  const handlePartnerIdChange = (value: string) => {
    if (validatePartnerId(value)) {
      setPartnerId(value);
      setPartnerIdAvailable(null); // Reset availability when ID changes
      setError(null);
    }
  };

  const handleCheckPartnerId = async () => {
    if (!partnerId) {
      setError('Vui lòng nhập ID đối tác');
      return;
    }

    if (partnerId.length < 3) {
      setError('ID đối tác phải có ít nhất 3 ký tự');
      return;
    }

    if (!validatePartnerId(partnerId)) {
      setError('ID đối tác chỉ được chứa chữ cái và số');
      return;
    }

    setError(null);
    setCheckingPartnerId(true);
    setPartnerIdAvailable(null);

    try {
      const response = await fetch('/api/check-partner-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check partner ID');
      }

      setPartnerIdAvailable(data.available);
      if (!data.available) {
        setError(data.message || 'ID đối tác này đã được sử dụng');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check partner ID');
      setPartnerIdAvailable(null);
    } finally {
      setCheckingPartnerId(false);
    }
  };

  // Available platforms (placeholders for future platforms)
  const platforms = [
    { value: 'exness', label: 'Exness', icon: '/getbot_section/exness.png' },
    { value: 'binance', label: 'Binance', disabled: false, icon: '/getbot_section/binance.png' },
    { value: 'bingx', label: 'BingX', disabled: true, icon: '/getbot_section/bingx.png' },
    { value: 'bitget', label: 'BitGet', disabled: true, icon: '/getbot_section/bitget.png' },
  ];

  const handlePlatformChange = (index: number, platform: string) => {
    const newList = [...credentialsList];
    newList[index] = {
      platform,
      username: '',
      password: '',
      url: '',
      verified: false,
    };
    setCredentialsList(newList);
    setError(null);
  };

  const handleCredentialChange = (
    index: number,
    field: 'username' | 'password' | 'url',
    value: string
  ) => {
    const newList = [...credentialsList];
    newList[index] = {
      ...newList[index],
      [field]: value,
      verified: false,
    };
    setCredentialsList(newList);
  };

  const addCredentialRow = () => {
    // Find a platform that's not already in use
    const usedPlatforms = credentialsList.map(cred => cred.platform);
    const availablePlatform = platforms.find(
      p => !p.disabled && !usedPlatforms.includes(p.value)
    );
    
    setCredentialsList([
      ...credentialsList,
      {
        platform: availablePlatform?.value || 'exness',
        username: '',
        password: '',
        url: '',
        verified: false,
      },
    ]);
  };

  const removeCredentialRow = (index: number) => {
    if (credentialsList.length > 1) {
      const newList = credentialsList.filter((_, i) => i !== index);
      setCredentialsList(newList);
    }
  };

  const handleCheckCredentials = async (index: number) => {
    const credentials = credentialsList[index];
    
    if (!credentials.username || !credentials.password || !credentials.url) {
      setError('Vui lòng nhập tên người dùng, mật khẩu và URL');
      return;
    }

    if (!validateUrl(credentials.url)) {
      setError('Vui lòng nhập URL hợp lệ (ví dụ: https://example.com)');
      return;
    }

    setError(null);
    setCheckingCredentials(index);

    try {
      // Only Exness is supported for now
      if (credentials.platform === 'exness') {
        const response = await fetch('/api/exness/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: credentials.username,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to verify credentials');
        }

        const newList = [...credentialsList];
        newList[index] = { ...newList[index], verified: true };
        setCredentialsList(newList);
      } else {
        setError('Hiện chỉ hỗ trợ nền tảng Exness');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify credentials');
      const newList = [...credentialsList];
      newList[index] = { ...newList[index], verified: false };
      setCredentialsList(newList);
    } finally {
      setCheckingCredentials(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate partner ID availability
    if (partnerIdAvailable !== true) {
      setError('Vui lòng kiểm tra tính khả dụng của ID đối tác');
      return;
    }

    // Validate partner password
    if (!isPasswordStrong) {
      setError('Vui lòng đảm bảo mật khẩu đáp ứng tất cả yêu cầu bảo mật');
      return;
    }

    if (partnerPassword !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    // Check if at least one credential is verified
    const hasVerifiedCredential = credentialsList.some((cred) => cred.verified);
    if (!hasVerifiedCredential) {
      setError('Vui lòng xác minh ít nhất một thông tin nền tảng');
      return;
    }

    if (!termsAccepted) {
      setError('Vui lòng chấp nhận các điều khoản và điều kiện');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Submit to Google Sheets
      const response = await fetch('/api/partner-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          partnerPassword,
          credentials: credentialsList
            .filter((cred) => cred.verified)
            .map((cred) => ({
              platform: cred.platform,
              username: cred.username,
              password: cred.password,
              url: cred.url,
              verified: cred.verified,
            })),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      // Show success modal
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  if (showSuccessModal) {
    return (
      <div 
        className={styles.overlay} 
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            setMouseDownOnOverlay(true);
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && mouseDownOnOverlay) {
            handleFinalClose();
          }
          setMouseDownOnOverlay(false);
        }}
      >
        <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>Đã Gửi Đơn Đăng Ký!</h2>
          <p className={styles.successMessage}>
            Cảm ơn bạn đã đăng ký trở thành đối tác. Đơn đăng ký của bạn sẽ được xem xét
            và xử lý trong vòng 24 giờ tới. Chúng tôi sẽ gửi thông báo qua email
            khi tài khoản của bạn được phê duyệt.
          </p>
          <button
            type="button"
            onClick={handleFinalClose}
            className={styles.successButton}
          >
            Đã hiểu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setMouseDownOnOverlay(true);
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownOnOverlay) {
          onClose();
        }
        setMouseDownOnOverlay(false);
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Đăng Ký Đối Tác Tradi</h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Partner ID */}
          <div className={styles.inputGroup}>
            <label htmlFor="partnerId" className={styles.label}>
              ID Đối Tác <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                id="partnerId"
                value={partnerId}
                onChange={(e) => handlePartnerIdChange(e.target.value)}
                required
                className={`${styles.input} ${
                  partnerIdAvailable === true ? styles.inputSuccess : partnerIdAvailable === false ? styles.inputError : ''
                }`}
                placeholder="ví dụ: AndyBao123"
                disabled={loading || checkingPartnerId}
                pattern="[a-zA-Z0-9]+"
                title="Chỉ cho phép chữ cái và số"
              />
              <button
                type="button"
                onClick={handleCheckPartnerId}
                className={`${styles.checkButton} ${
                  partnerIdAvailable === true ? styles.verified : ''
                }`}
                disabled={loading || checkingPartnerId || !partnerId || partnerId.length < 3}
              >
                {checkingPartnerId
                  ? '...'
                  : partnerIdAvailable === true
                  ? '✓'
                  : 'Kiểm Tra'}
              </button>
            </div>
            {partnerIdAvailable === true && (
              <p className={styles.successText}>
                <Check size={16} /> ID đối tác khả dụng
              </p>
            )}
            {partnerIdAvailable === false && (
              <p className={styles.errorText}>
                <X size={16} /> ID đối tác này đã được sử dụng
              </p>
            )}
            <p className={styles.helperText}>
              Chỉ cho phép chữ cái và số (không có khoảng trắng hoặc ký tự đặc biệt)
            </p>
          </div>

          {/* Password Row - Create and Confirm Password Side by Side */}
          <div className={styles.passwordRow}>
            {/* Create Password */}
            <div className={styles.inputGroup}>
              <label htmlFor="partnerPassword" className={styles.label}>
                Tạo Mật Khẩu <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                id="partnerPassword"
                value={partnerPassword}
                onChange={(e) => setPartnerPassword(e.target.value)}
                required
                className={`${styles.input} ${
                  partnerPassword && !isPasswordStrong ? styles.inputError : partnerPassword && isPasswordStrong ? styles.inputSuccess : ''
                }`}
                placeholder="Nhập mật khẩu mạnh"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Xác Nhận Mật Khẩu <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={`${styles.input} ${
                  passwordsMatch ? styles.inputSuccess : passwordsDontMatch ? styles.inputError : ''
                }`}
                placeholder="Nhập lại mật khẩu"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Validation Messages */}
          {partnerPassword && (
            <div className={styles.passwordCriteria}>
              <p className={styles.criteriaTitle}>Mật khẩu phải chứa:</p>
              <ul className={styles.criteriaList}>
                <li className={passwordCriteria.minLength ? styles.criteriaMet : styles.criteriaUnmet}>
                  {passwordCriteria.minLength ? <Check size={14} /> : <X size={14} />} Ít nhất 8 ký tự
                </li>
                <li className={passwordCriteria.hasUppercase ? styles.criteriaMet : styles.criteriaUnmet}>
                  {passwordCriteria.hasUppercase ? <Check size={14} /> : <X size={14} />} Một chữ cái viết hoa (A-Z)
                </li>
                <li className={passwordCriteria.hasLowercase ? styles.criteriaMet : styles.criteriaUnmet}>
                  {passwordCriteria.hasLowercase ? <Check size={14} /> : <X size={14} />} Một chữ cái viết thường (a-z)
                </li>
                <li className={passwordCriteria.hasNumber ? styles.criteriaMet : styles.criteriaUnmet}>
                  {passwordCriteria.hasNumber ? <Check size={14} /> : <X size={14} />} Một chữ số (0-9)
                </li>
                <li className={passwordCriteria.hasSpecial ? styles.criteriaMet : styles.criteriaUnmet}>
                  {passwordCriteria.hasSpecial ? <Check size={14} /> : <X size={14} />} Một ký tự đặc biệt (!@#$%^&*...)
                </li>
              </ul>
            </div>
          )}

          {passwordsMatch && (
            <p className={styles.successText}>
              <Check size={16} /> Mật khẩu khớp
            </p>
          )}
          {passwordsDontMatch && (
            <p className={styles.errorText}>
              <X size={16} /> Mật khẩu không khớp
            </p>
          )}

          {/* Platform Credentials Section */}
          <div className={styles.credentialsSection}>
            <div className={styles.credentialsHeader}>
              <label className={styles.label}>
                Liên kết API sàn <span className={styles.required}>*</span>
              </label>
              <button
                type="button"
                onClick={addCredentialRow}
                className={styles.addButton}
                disabled={loading}
              >
                + Thêm Sàn
              </button>
            </div>

            {credentialsList.map((credentials, index) => (
              <div key={index} className={styles.credentialItem}>
                {/* First Row: Platform Dropdown and URL */}
                <div className={styles.credentialsRow1}>
                  {/* Custom Platform Dropdown with Icon */}
                  <div className={styles.customSelectWrapper}>
                    <div 
                      className={`${styles.customSelect} ${openDropdownIndex === index ? styles.customSelectOpen : ''}`}
                      onClick={() => !loading && setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
                    >
                      <img 
                        src={platforms.find(p => p.value === credentials.platform)?.icon}
                        alt={credentials.platform}
                        className={styles.customSelectIcon}
                      />
                      <span className={styles.customSelectLabel}>
                        {platforms.find(p => p.value === credentials.platform)?.label}
                      </span>
                      <ChevronDown className={styles.customSelectArrow} size={16} />
                    </div>
                    {openDropdownIndex === index && (
                      <div className={styles.customSelectDropdown}>
                        {platforms.map((platform) => (
                          <div
                            key={platform.value}
                            className={`${styles.customSelectOption} ${
                              platform.disabled ? styles.customSelectOptionDisabled : ''
                            } ${
                              credentials.platform === platform.value ? styles.customSelectOptionSelected : ''
                            }`}
                            onClick={() => {
                              if (!platform.disabled) {
                                handlePlatformChange(index, platform.value);
                                setOpenDropdownIndex(null);
                              }
                            }}
                          >
                            <img 
                              src={platform.icon}
                              alt={platform.label}
                              className={styles.customSelectOptionIcon}
                            />
                            <span>{platform.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* URL */}
                  <input
                    type="url"
                    value={credentials.url}
                    onChange={(e) =>
                      handleCredentialChange(index, 'url', e.target.value)
                    }
                    placeholder={`Link ref của sàn ${credentials.platform.charAt(0).toUpperCase() + credentials.platform.slice(1)}`}
                    className={styles.input}
                    disabled={loading || checkingCredentials === index}
                    required
                    pattern="https?://.*"
                    title="Vui lòng nhập URL hợp lệ bắt đầu với http:// hoặc https://"
                  />

                  {/* Remove Button */}
                  {credentialsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCredentialRow(index)}
                      className={styles.removeButton}
                      disabled={loading}
                      aria-label="Xóa thông tin"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Description Text */}
                <p className={styles.helperText} style={{ marginTop: '12px', marginBottom: '8px' }}>
                  Chúng tôi thu thập Email và Password đăng nhập tại sàn{' '}
                  <strong>{platforms.find(p => p.value === credentials.platform)?.label}</strong>{' '}
                  của bạn nhằm mục đích tạo link đối tác Tradi riêng cho bạn theo định dạng:{' '}
                  <strong>vnclc.com/{partnerId || 'ID Đối Tác của bạn'}</strong>. Thông tin này là cần thiết để quá trình tạo link và API tự động được thực hiện thành công. 
                  Chúng tôi cam kết không sử dụng các thông tin này cho bất kỳ mục đích nào khác và đảm bảo bảo mật tuyệt đối.
                </p>

                {/* Second Row: Email, Password, Check Button */}
                <div className={styles.credentialsRow2}>
                  {/* Username */}
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) =>
                      handleCredentialChange(index, 'username', e.target.value)
                    }
                    placeholder="Email"
                    className={styles.input}
                    disabled={loading || checkingCredentials === index}
                    required
                  />

                  {/* Password */}
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) =>
                      handleCredentialChange(index, 'password', e.target.value)
                    }
                    placeholder="Mật Khẩu"
                    className={styles.input}
                    disabled={loading || checkingCredentials === index}
                    required
                  />

                  {/* Check Button */}
                  <button
                    type="button"
                    onClick={() => handleCheckCredentials(index)}
                    className={`${styles.checkButton} ${
                      credentials.verified ? styles.verified : ''
                    }`}
                    disabled={
                      loading ||
                      checkingCredentials === index ||
                      !credentials.username ||
                      !credentials.password ||
                      !credentials.url ||
                      !validateUrl(credentials.url)
                    }
                  >
                    {checkingCredentials === index
                      ? '...'
                      : credentials.verified
                      ? '✓'
                      : 'Kiểm Tra'}
                  </button>
                </div>

                {credentials.verified && (
                  <p className={styles.verifiedText}>
                    <Check size={16} /> Xác minh thông tin thành công!
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {/* Terms Checkbox */}
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className={styles.checkbox}
              disabled={loading}
            />
            <label htmlFor="terms" className={styles.checkboxLabel}>
              Tôi xác nhận và đồng ý với{' '}
              <a href="#" className={styles.link}>
                Điều Khoản Dịch Vụ
              </a>{' '}
              và{' '}
              <a href="#" className={styles.link}>
                Chính Sách Bảo Mật
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={
              loading ||
              !credentialsList.some((cred) => cred.verified) ||
              !termsAccepted ||
              !partnerId ||
              partnerIdAvailable !== true ||
              !partnerPassword ||
              !isPasswordStrong ||
              partnerPassword !== confirmPassword
            }
          >
            {loading ? 'Đang Gửi...' : 'Gửi Đơn Đăng Ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
