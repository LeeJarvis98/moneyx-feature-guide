'use client';

import { useState } from 'react';
import { Diamond, Gem, Star, Award, Medal, Shield, X, Sparkles, ArrowRight, LogIn, Link as LinkIcon } from 'lucide-react';
import styles from './CongratulationsModal.module.css';

interface CongratulationsModalProps {
  rank: string;
  partnerType: 'new' | 'system';
  onClose: () => void;
  onNavigateToLogin: () => void;
}

const rankIcons: Record<string, typeof Diamond> = {
  'Kim Cương': Diamond,
  'Ruby': Gem,
  'Bạch Kim': Star,
  'Vàng': Award,
  'Bạc': Medal,
  'Đồng': Shield,
};

const rankPercentages: Record<string, { partner: string; tradi: string }> = {
  'Kim Cương': { partner: '95%', tradi: '5%' },
  'Ruby': { partner: '90%', tradi: '10%' },
  'Bạch Kim': { partner: '85%', tradi: '15%' },
  'Vàng': { partner: '80%', tradi: '20%' },
  'Bạc': { partner: '75%', tradi: '25%' },
  'Đồng': { partner: '70%', tradi: '30%' },
};

export default function CongratulationsModal({ rank, partnerType, onClose, onNavigateToLogin }: CongratulationsModalProps) {
  const [stage, setStage] = useState<1 | 2>(1);
  const IconComponent = rankIcons[rank] || Shield;
  const percentages = rankPercentages[rank] || { partner: '70%', tradi: '30%' };
  
  const partnerTypeText = partnerType === 'new' ? 'Đối Tác Tradi' : 'Đại Lí Hệ Thống';

  const handleContinue = () => {
    if (stage === 1) {
      // Navigate to PartnerLogin in the background
      onNavigateToLogin();
      // Move to stage 2
      setStage(2);
    } else {
      // Stage 2: Close the modal
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => {
      // Only allow closing on stage 2
      if (stage === 2) {
        onClose();
      }
    }}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button 
          className={`${styles.closeButton} ${stage === 1 ? styles.closeButtonHidden : ''}`}
          onClick={onClose} 
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {stage === 1 ? (
          // Stage 1: Congratulations
          <>
            <div className={styles.celebrationIcon}>
              <Sparkles className={styles.sparkle} size={32} />
            </div>

            <h2 className={styles.title}>Chúc Mừng!</h2>
            <p className={styles.subtitle}>Bạn đã đăng ký thành công</p>

            <div className={styles.partnerTypeCard}>
              <div className={styles.partnerTypeBadge}>{partnerTypeText}</div>
            </div>

            <div className={styles.rankCard}>
              <div className={styles.rankHeader}>
                <IconComponent size={32} className={styles.rankIcon} />
                <h3 className={styles.rankName}>{rank}</h3>
              </div>
              
              <div className={styles.rewardInfo}>
                <div className={styles.rewardItem}>
                  <span className={styles.rewardLabel}>Hoa hồng đối tác:</span>
                  <span className={styles.rewardValue}>{percentages.partner}</span>
                </div>
                <div className={styles.rewardItem}>
                  <span className={styles.rewardLabel}>Hoa hồng Tradi:</span>
                  <span className={styles.rewardValue}>{percentages.tradi}</span>
                </div>
              </div>
            </div>

            <div className={styles.infoBox}>
              {partnerType === 'new' ? (
                <>
                  <p className={styles.infoText}>
                    ✨ Bạn bắt đầu với cấp độ <strong>{rank}</strong>
                  </p>
                  <p className={styles.infoText}>
                    📈 Hoàn thành giao dịch để tăng cấp và nhận hoa hồng cao hơn
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.infoText}>
                    ✨ Bạn bắt đầu với cấp độ <strong>{rank}</strong>
                  </p>
                  <p className={styles.infoText}>
                    🔗 Hoa hồng của bạn sẽ tăng theo cấp độ hệ thống tổng
                  </p>
                </>
              )}
            </div>

            <button className={styles.continueButton} onClick={handleContinue}>
              Tiếp Tục
              <ArrowRight size={20} />
            </button>
          </>
        ) : (
          // Stage 2: Instructions
          <>
            <div className={styles.instructionIcon}>
              <LogIn className={styles.instructionIconSvg} size={48} />
            </div>

            <h2 className={styles.title}>Hoàn Tất Thiết Lập</h2>
            <p className={styles.subtitle}>Làm theo các bước sau để bắt đầu</p>

            <div className={styles.instructionSteps}>
              <div className={styles.instructionStep}>
                <div className={styles.stepNumber}>
                  <LinkIcon size={20} />
                </div>
                <div className={styles.stepContent}>
                  <h4 className={styles.stepTitle}>Bước 1: Thêm Link Giới Thiệu</h4>
                  <p className={styles.stepDescription}>
                    Nhập link giới thiệu của bạn vào bảng bên phải. Điền ít nhất một link cho sàn giao dịch bạn chọn.
                  </p>
                </div>
              </div>

              <div className={styles.instructionStep}>
                <div className={styles.stepNumber}>
                  <LogIn size={20} />
                </div>
                <div className={styles.stepContent}>
                  <h4 className={styles.stepTitle}>Bước 2: Đăng Nhập Tài Khoản Sàn</h4>
                  <p className={styles.stepDescription}>
                    Sử dụng màn hình đăng nhập bên dưới để kết nối tài khoản sàn giao dịch của bạn.
                  </p>
                </div>
              </div>

              <div className={styles.instructionStep}>
                <div className={styles.stepNumber}>
                  <Sparkles size={20} />
                </div>
                <div className={styles.stepContent}>
                  <h4 className={styles.stepTitle}>Bước 3: Bắt Đầu Kiếm Hoa Hồng</h4>
                  <p className={styles.stepDescription}>
                    Sau khi hoàn tất, bạn có thể bắt đầu giới thiệu khách hàng và nhận hoa hồng!
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.infoBox}>
              <p className={styles.infoText}>
                💡 <strong>Lưu ý:</strong> Bạn cần hoàn thành cả 2 bước để có thể sử dụng hệ thống đối tác.
              </p>
            </div>

            <button className={styles.continueButton} onClick={handleContinue}>
              Đã Hiểu
            </button>
          </>
        )}
      </div>
    </div>
  );
}
