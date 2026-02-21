'use client';

import { useState, useEffect } from 'react';
import { Gem, Diamond, Star, Award, Medal, Shield } from 'lucide-react';
import CongratulationsModal from './CongratulationsModal';
import styles from './PartnerAgreement.module.css';

interface PartnerAgreementProps {
  onAccept: () => void;
  selectedPlatform: string | null;
  onPlatformSelect: (platform: string) => void;
  userId: string;
}

const partnerTiers = [
  { name: 'Kim Cương', partner: '90%', tradi: '10%', condition: '2000 Lot', icon: Gem },
  { name: 'Ruby', partner: '85%', tradi: '15%', condition: '1200 Lot', icon: Diamond },
  { name: 'Bạch Kim', partner: '80%', tradi: '20%', condition: '600 Lot', icon: Star },
  { name: 'Vàng', partner: '75%', tradi: '25%', condition: '300 Lot', icon: Award },
  { name: 'Bạc', partner: '70%', tradi: '30%', condition: '100 Lot', icon: Medal },
  { name: 'Đồng', partner: '65%', tradi: '35%', condition: 'Hoàn thành', icon: Shield },
];

export default function PartnerAgreement({ onAccept, selectedPlatform, onPlatformSelect, userId }: PartnerAgreementProps) {
  const [hasRead, setHasRead] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [partnerType, setPartnerType] = useState<'DTT' | 'DLHT' | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasClickedTerms, setHasClickedTerms] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [showOnlyTradi, setShowOnlyTradi] = useState(false);
  const [isCheckingReferrer, setIsCheckingReferrer] = useState(true);
  const [referrerCheckError, setReferrerCheckError] = useState<string | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [registeredRank, setRegisteredRank] = useState<string>('Đồng');
  const [registeredPartnerType, setRegisteredPartnerType] = useState<'new' | 'system'>('new');

  // Check referrer status on mount
  useEffect(() => {
    const checkReferrerStatus = async () => {
      try {
        const response = await fetch('/api/check-referrer-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[PartnerAgreement] Referrer check result:', data);
          
          // Check for edge cases that should show errors
          if (data.reason === 'no_referrer') {
            setReferrerCheckError('Bạn chưa có người giới thiệu. Vui lòng liên hệ admin để được hỗ trợ.');
          } else if (data.reason === 'referrer_not_found') {
            setReferrerCheckError('Không tìm thấy thông tin người giới thiệu. Vui lòng liên hệ admin.');
          } else if (data.reason === 'referrer_data_not_found') {
            setReferrerCheckError('Dữ liệu người giới thiệu không hợp lệ. Vui lòng liên hệ admin.');
          } else {
            // Valid referrer found
            setShowOnlyTradi(data.showOnlyTradi);
            setReferrerCheckError(null);
          }
        } else {
          console.error('[PartnerAgreement] Failed to check referrer status');
          setReferrerCheckError('Không thể kiểm tra thông tin người giới thiệu. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('[PartnerAgreement] Error checking referrer:', error);
        setReferrerCheckError('Lỗi hệ thống khi kiểm tra thông tin. Vui lòng thử lại sau.');
      } finally {
        setIsCheckingReferrer(false);
      }
    };

    checkReferrerStatus();
  }, [userId]);

  const canProceed = hasConfirmed;
  const canConfirm = hasRead && hasAgreed;

  const handleConfirm = () => {
    if (canConfirm) {
      setHasConfirmed(true);
      setShowTermsModal(false);
    }
  };

  const handlePartnerTypeSelect = async (type: 'DTT' | 'DLHT') => {
    if (!canProceed || isRegistering) return;

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      const response = await fetch('/api/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, partnerType: type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register as partner');
      }

      console.log('[PartnerAgreement] Registration successful:', data);
      setPartnerType(type);
      
      // Store rank and referral ID for page update
      if (data.rank) {
        localStorage.setItem('partnerRank', data.rank);
        setRegisteredRank(data.rank);
        
        // Dispatch custom event for same-window update
        window.dispatchEvent(new CustomEvent('partnerRankUpdated', { 
          detail: { rank: data.rank } 
        }));
      }
      
      // Store and dispatch referral ID if provided
      if (data.referralId) {
        console.log('[PartnerAgreement] Setting referral ID:', data.referralId);
        // Store in sessionStorage for persistence
        sessionStorage.setItem('referralId', data.referralId);
        // Dispatch custom event for referral ID update
        window.dispatchEvent(new CustomEvent('referralIdUpdated', { 
          detail: { referralId: data.referralId } 
        }));
      }
      
      // Dispatch partner type update event
      console.log('[PartnerAgreement] Setting partner type:', type);
      sessionStorage.setItem('partnerType', type);
      window.dispatchEvent(new CustomEvent('partnerTypeUpdated', { 
        detail: { partnerType: type } 
      }));
      
      // Map partner type to modal format: DTT → 'new', DLHT → 'system'
      const modalPartnerType = type === 'DTT' ? 'new' : 'system';
      setRegisteredPartnerType(modalPartnerType);
      
      // Show congratulations modal immediately
      setShowCongratulations(true);
    } catch (error) {
      console.error('[PartnerAgreement] Registration error:', error);
      setRegistrationError(error instanceof Error ? error.message : 'Failed to register');
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
            Đối tác được hưởng hoa hồng theo 6 cấp độ và chia sẻ phí dịch vụ Tradi khi giới thiệu thành công Bot VNCLC cho user mới.
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

              {/* Terms Button */}
              <button
                className={`${styles.termsButton} ${styles.termsButtonFilled} ${!hasClickedTerms ? styles.breathing : ''}`}
                onClick={() => {
                  setShowTermsModal(true);
                  setHasClickedTerms(true);
                }}
              >
                Điều khoản hợp tác & bảo mật
              </button>

              {/* Buttons */}
              <div className={styles.buttonContainer}>
                {registrationError && (
                  <div className={styles.errorMessage}>
                    {registrationError}
                  </div>
                )}
                {isCheckingReferrer ? (
                  <div className={styles.loadingMessage}>
                    Đang kiểm tra thông tin...
                  </div>
                ) : referrerCheckError ? (
                  <div className={styles.errorMessage}>
                    {referrerCheckError}
                  </div>
                ) : (
                  <div className={`${styles.buttonGrid} ${showOnlyTradi ? styles.singleButton : ''}`}>
                    <div className={styles.buttonWrapper}>
                      <div className={styles.buttonInfo}>
                        <span className={styles.commissionLabel}>Hoa hồng: 65%</span>
                        <span className={styles.commissionSubtext}>(nâng được)</span>
                      </div>
                      <button
                        className={styles.partnerButton}
                        onClick={() => handlePartnerTypeSelect('DTT')}
                        disabled={!canProceed || isRegistering}
                      >
                        {isRegistering ? 'Đang đăng ký...' : 'ĐỐI TÁC TRADI'}
                      </button>
                    </div>

                    {!showOnlyTradi && (
                      <div className={styles.buttonWrapper}>
                        <div className={styles.buttonInfo}>
                          <span className={styles.commissionLabel}>Hoa hồng hệ thống: 85%</span>
                          <span className={styles.commissionSubtext}>(chỉ nâng khi hệ thống nâng cấp)</span>
                        </div>
                        <button
                          className={styles.partnerButton}
                          onClick={() => handlePartnerTypeSelect('DLHT')}
                          disabled={!canProceed || isRegistering}
                        >
                          {isRegistering ? 'Đang đăng ký...' : 'ĐẠI LÍ HỆ THỐNG'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                  {/* <li>Đối tác không phải nhận viên, không đại diện pháp lý cho công ty.</li> */}
                  {/* <li>Tradi có quyền chấm dứt hợp đồng với đối tác nếu đối tác vi phạm điều khoản.</li> */}
                  <li>Bot VNCLC là Bot miễn phí, chỉ được chia sẻ Link Ref công đồng, không MUA - BÁN.</li>
                  <li>Đối tác phải đạt cấp Bạc trở lên mới có thể sử dụng Partner System tìm nhanh dưới.</li>
                  <li>Đối tác cung cấp Link Ref sàn và thông tin liên hệ để Tradi tạo hệ thống trên website.</li>
                  {/* <li>Đối tác nên đạt ngưỡng cấp độ Kim Cương, để hệ thống đối tác được nâng lên Max 90%.</li> */}
                </ol>

                <h4 className={styles.termsSectionTitle}>ĐẠI LÍ ĐƯỢC GIỚI THIỆU :</h4>
                <ol className={styles.termsList}>
                  <li>Đại lí có thể chuyển đổi đại lí hệ thống khác (sau mỗi 30 ngày).</li>
                  <li>Đại lí có thể chuyển đổi thức đại lí hệ thống thành đối tác mới (sau mỗi 30 ngày).</li>
                  <li>Đối tác mới (có thể tăng cấp được):</li>
                  <li className={styles.subItem}>+ Bắt đầu từ cấp độ Đồng 70%, chia sẻ hoa hồng cho người giới thiệu đến khi bằng cấp độ.</li>
                  <li className={styles.subItem}>+ Khi bằng cấp độ, đối tác "không còn" trong hệ thống được giới thiệu nữa.</li>
                  <li>Đại lí hệ thống (không tự thăng cấp được):</li>
                  <li className={styles.subItem}>+ Hoa hồng luôn dưới hệ thống tổng 1 bậc.</li>
                  <li className={styles.subItem}>+ Hệ thống tổng tăng lên 1 cấp, đại lí hệ thống được tăng theo 1 cấp.</li>
                </ol>
              </div>

              {/* Checkboxes */}
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
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongratulations && (
        <CongratulationsModal
          rank={registeredRank}
          partnerType={registeredPartnerType}
          onClose={() => {
            setShowCongratulations(false);
            // After closing modal, navigate to partner login
            onAccept();
          }}
          onNavigateToLogin={() => {
            // This is called when user clicks continue on stage 1
            // We don't navigate yet, just move to stage 2 of the modal
          }}
        />
      )}
    </div>
  );
}