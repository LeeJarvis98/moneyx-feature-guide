'use client';

import { useState } from 'react';
import styles from './PartnerAgreement.module.css';

interface PartnerAgreementProps {
  onAccept: () => void;
  selectedPlatform: string | null;
  onPlatformSelect: (platform: string) => void;
}

const partnerTiers = [
  { name: 'Đồng', partner: '70%', tradi: '30%' },
  { name: 'Bạc', partner: '75%', tradi: '25%' },
  { name: 'Vàng', partner: '80%', tradi: '20%' },
  { name: 'Bạch Kim', partner: '85%', tradi: '15%' },
  { name: 'Đá Quý', partner: '90%', tradi: '10%' },
  { name: 'Kim Cương', partner: '95%', tradi: '5%' },
];

export default function PartnerAgreement({ onAccept, selectedPlatform, onPlatformSelect }: PartnerAgreementProps) {
  const [hasRead, setHasRead] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [partnerType, setPartnerType] = useState<'new' | 'system' | null>(null);

  const canProceed = hasRead && hasAgreed;

  const handlePartnerTypeSelect = (type: 'new' | 'system') => {
    if (canProceed) {
      setPartnerType(type);
      onAccept();
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
        <source src="/vnclc-partner.mp4" type="video/mp4" />
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
            {/* Left Section: Commission Table, Checkboxes, Buttons */}
            <div className={styles.leftSection}>
              <div className={styles.tableContainer}>
                <div className={styles.tableColumn}>
                  <h3 className={styles.columnTitle}>ĐỐI TÁC</h3>
                  {partnerTiers.map((tier, index) => (
                    <div key={index} className={styles.tierRow}>
                      <span className={styles.checkmark}>✓</span>
                      <span className={styles.tierName}>{tier.name} :</span>
                      <span className={styles.percentage}>{tier.partner}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.divider} />

                <div className={styles.tableColumn}>
                  <h3 className={styles.columnTitle}>TRADI</h3>
                  {partnerTiers.map((tier, index) => (
                    <div key={index} className={styles.tradiRow}>
                      <span className={styles.tradiPercentage}>{tier.tradi}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkboxes */}
              <div className={styles.checkboxContainer}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={hasRead}
                    onChange={(e) => setHasRead(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>Tôi đã đọc và hiểu</span>
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>Tôi đồng ý với các điều khoản trên</span>
                </label>
              </div>

              {/* Buttons */}
              <div className={styles.buttonContainer}>
                <div className={styles.buttonWrapper}>
                  <div className={styles.buttonInfo}>
                    <span className={styles.commissionLabel}>Hoa hồng : 70%</span>
                    <span className={styles.commissionSubtext}>(nâng được)</span>
                  </div>
                  <button
                    className={styles.partnerButton}
                    onClick={() => handlePartnerTypeSelect('new')}
                    disabled={!canProceed}
                  >
                    ĐỐI TÁC MỚI
                  </button>
                </div>

                <div className={styles.buttonWrapper}>
                  <div className={styles.buttonInfo}>
                    <span className={styles.commissionLabel}>Hoa hồng : 85%</span>
                    <span className={styles.commissionSubtext}>(chỉ nâng khi hệ thống nâng cấp)</span>
                  </div>
                  <button
                    className={styles.partnerButton}
                    onClick={() => handlePartnerTypeSelect('system')}
                    disabled={!canProceed}
                  >
                    ĐỐI TÁC HỆ THỐNG
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section: Terms & Privacy */}
            <div className={styles.rightSection}>
              <div className={styles.termsSection}>
                <h3 className={styles.termsTitle}>Điều khoản hợp tác & bảo mật</h3>
                <ol className={styles.termsList}>
                  <li>Mọi thông tin tiền quan đến khách hàng, tài khoản giao dịch đều được bảo mật tuyệt đối.</li>
                  <li>Mọi hành vi vi phạm bảo mật gây thiệt hại sẽ hoàn toàn chịu trách nhiệm pháp lý.</li>
                  <li>Thời gian thanh lý hoa hồng phải được trả đúng kỳ hạn.</li>
                  <li>Tradi có quyền chấp dứt hợp đồng với đối tác nếu đối tác vi phạm điều khoản.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}