'use client';

import { useState } from 'react';
import { Gem, Diamond, Star, Award, Medal, Shield } from 'lucide-react';
import styles from './PartnerAgreement.module.css';

interface PartnerAgreementProps {
  onAccept: () => void;
  selectedPlatform: string | null;
  onPlatformSelect: (platform: string) => void;
  userId: string;
  isPartner?: boolean;
  onRegistrationSuccess: (rank: string) => void;
}

const partnerTiers = [
  { name: 'Kim Cương', partner: '90%', tradi: '10%', condition: '2000 Lot', icon: Gem },
  { name: 'Bạch Kim', partner: '85%', tradi: '15%', condition: '1000 Lot', icon: Diamond },
  { name: 'Vàng', partner: '80%', tradi: '20%', condition: '500 Lot', icon: Star },
  { name: 'Bạc', partner: '75%', tradi: '25%', condition: '100 Lot', icon: Award },
  { name: 'Đồng', partner: '70%', tradi: '30%', condition: 'Hoàn thành', icon: Medal },
];

export default function PartnerAgreement({ onAccept, selectedPlatform, onPlatformSelect, userId, isPartner = false, onRegistrationSuccess }: PartnerAgreementProps) {
  const [hasRead, setHasRead] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasClickedTerms, setHasClickedTerms] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // No referrer check needed - single partner type system

  const canProceed = hasConfirmed;
  const canConfirm = hasRead && hasAgreed;

  const handleConfirm = () => {
    if (canConfirm) {
      setHasConfirmed(true);
      setShowTermsModal(false);
    }
  };

  const handleRegisterAsPartner = async () => {
    if (!canProceed || isRegistering) return;

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register as partner');
      }

      console.log('[PartnerAgreement] Registration successful:', data);
      
      // Get rank from response or use default
      const newRank = data.rank || 'Đồng';
      
      // Store rank and referral ID for page update
      localStorage.setItem('partnerRank', newRank);
      
      // Dispatch custom event for same-window update
      window.dispatchEvent(new CustomEvent('partnerRankUpdated', { 
        detail: { rank: newRank } 
      }));
      
      // Store and dispatch referral ID if provided
      if (data.referralId) {
        console.log('[PartnerAgreement] Setting referral ID:', data.referralId);
        // Store in both sessionStorage and localStorage for persistence
        sessionStorage.setItem('referralId', data.referralId);
        localStorage.setItem('referralId', data.referralId);
        // Dispatch custom event for referral ID update
        window.dispatchEvent(new CustomEvent('referralIdUpdated', { 
          detail: { referralId: data.referralId } 
        }));
      }
      
      // Trigger registration success callback
      console.log('[PartnerAgreement] Calling onRegistrationSuccess with rank:', newRank);
      onRegistrationSuccess(newRank);
    } catch (error) {
      console.error('[PartnerAgreement] Registration error:', error);
      
      // Check if error is due to timeout
      if (error instanceof Error && error.name === 'AbortError') {
        setRegistrationError('Đăng ký quá lâu. Vui lòng thử lại hoặc kiểm tra kết nối mạng.');
      } else {
        setRegistrationError(error instanceof Error ? error.message : 'Failed to register');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Video Background */}
      <video
        className={styles.backgroundVideo}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/vnclc-partner-background.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className={styles.overlay} />

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.mainContent}>
          <h1 className={styles.title}>HOA HỒNG ĐỐI TÁC</h1>
          
          <p className={styles.description}>
            Đối tác được hưởng hoa hồng theo 5 cấp độ và chia sẻ phí dịch vụ Tradi khi giới thiệu thành công Bot VNCLC cho user mới.
          </p>

          <div className={styles.horizontalLayout}>
            <div className={styles.leftSection}>
              <div className={styles.tableContainer}>
                {/* Table Header */}
                <div className={styles.tableHeader}>
                  <div className={styles.headerCell}>CẤP ĐỘ</div>
                  <div className={styles.headerCell}>ĐỐI TÁC</div>
                  <div className={styles.headerCell}>TRADI</div>
                  <div className={styles.headerCell}>ĐIỀU KIỆN</div>
                </div>

                {/* Table Body */}
                <div className={styles.tableBody}>
                  {partnerTiers.map((tier, index) => {
                    const IconComponent = tier.icon;
                    return (
                    <div key={index} className={styles.tableRow}>
                      <div className={styles.tableCell}>
                        <IconComponent size={18} className={styles.checkmark} />
                        <span className={styles.tierName}>{tier.name}</span>
                      </div>
                      <div className={styles.tableCell}>
                        <span className={styles.percentage}>{tier.partner}</span>
                      </div>
                      <div className={styles.tableCell}>
                        <span className={styles.tradiPercentage}>{tier.tradi}</span>
                      </div>
                      <div className={styles.tableCell}>
                        <span className={styles.conditionText}>{tier.condition}</span>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>

              {/* Buttons */}
              {!isPartner && (
                <div className={styles.buttonContainer}>
                  {registrationError && (
                    <div className={styles.errorMessage}>
                      {registrationError}
                    </div>
                  )}
                  <div className={styles.buttonGrid}>
                    <button
                      className={`${styles.termsButton} ${styles.termsButtonFilled} ${!hasClickedTerms ? styles.breathing : ''}`}
                      onClick={() => {
                        setShowTermsModal(true);
                        setHasClickedTerms(true);
                      }}
                    >
                      Điều khoản hợp tác & bảo mật
                    </button>
                    <button
                      className={styles.partnerButton}
                      onClick={handleRegisterAsPartner}
                      disabled={!canProceed || isRegistering}
                    >
                      {isRegistering ? 'Đang đăng ký...' : 'ĐĂNG KÝ ĐẠI LÝ TRADI'}
                    </button>
                  </div>
                </div>
              )}
              {isPartner && (
                <div className={styles.buttonContainer}>
                  <button
                    className={`${styles.termsButton} ${styles.termsButtonFilled}`}
                    onClick={() => setShowTermsModal(true)}
                  >
                    Xem điều khoản hợp tác & bảo mật
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTermsModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalClose}
              onClick={() => setShowTermsModal(false)}
            >
              ✕
            </button>
            
            <div className={styles.termsSection}>
              <h3 className={styles.termsTitle}>Điều khoản hợp tác & bảo mật</h3>
              
              <div className={styles.termsContent}>
                <h4 className={styles.termsSectionTitle}>ĐỐI TÁC:</h4>
                <ol className={styles.termsList}>
                  <li>Mọi thông tin liên quan đến khách hàng, tài khoản giao dịch đều được bảo mật tuyệt đối.</li>
                  <li>Mọi hành vi vi phạm bảo mật gây thiệt hại sẽ hoàn toàn chịu trách nhiệm pháp lý.</li>
                  <li>Bot VNCLC là Bot miễn phí, chỉ được chia sẻ Link Ref công đồng, không MUA - BÁN.</li>
                  <li>Đối tác phải đạt cấp Bạc trở lên mới có thể sử dụng Partner System tìm nhanh dưới.</li>
                  <li>Đối tác cung cấp Link Ref sàn và thông tin liên hệ để Tradi tạo hệ thống trên website.</li>
                  <li>Cấp bậc được xác định dựa trên vị trí trong chuỗi giới thiệu và tổng khối lượng giao dịch.</li>
                </ol>

                <h4 className={styles.termsSectionTitle}>HỆ THỐNG HOA HỔNG:</h4>
                <ol className={styles.termsList}>
                  <li>Đối tác bắt đầu từ cấp độ Đồng (70%), chia sẻ hoa hồng cho người giới thiệu.</li>
                  <li>Hoa hồng được tính và chi trả vào ngày 1 hàng tháng.</li>
                  <li>Công thức chia hoa hồng: 5% cho Tradi, 50% cho người giới thiệu trực tiếp, 50% còn lại chia đều cho upline gián tiếp.</li>
                  <li>Cấp bậc tăng dần dựa vào tổng khối lượng giao dịch tích lũy.</li>
                </ol>
              </div>

              {/* Checkboxes - only shown for non-partners */}
              {!isPartner && (
                <div className={styles.checkboxContainer}>
                  <div className={styles.checkboxWrapper}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={hasRead}
                        onChange={(e) => {
                          setHasRead(e.target.checked);
                          if (!e.target.checked) {
                            setHasConfirmed(false);
                          }
                        }}
                        className={styles.checkbox}
                      />
                      <span>Tôi đã đọc và hiểu</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={hasAgreed}
                        onChange={(e) => {
                          setHasAgreed(e.target.checked);
                          if (!e.target.checked) {
                            setHasConfirmed(false);
                          }
                        }}
                        className={styles.checkbox}
                      />
                      <span>Tôi đồng ý với các điều khoản trên</span>
                    </label>
                  </div>

                  <button
                    className={styles.confirmButton}
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}