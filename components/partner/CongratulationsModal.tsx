'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, ArrowRight, LogIn, Link as LinkIcon } from 'lucide-react';
import styles from './CongratulationsModal.module.css';

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLogin: () => void;
}

export default function CongratulationsModal({ isOpen, onClose, onNavigateToLogin }: CongratulationsModalProps) {
  const [stage, setStage] = useState<1 | 2>(1);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    // Ensure we're in the browser
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reset to stage 1 when modal opens
      setStage(1);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  // Only render when open and on the client side
  if (!isOpen || !isBrowser) {
    return null;
  }

  return createPortal(
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
            <p className={styles.subtitle}>Bạn đã đăng ký thành công Đại Lý Tradi</p>

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

            <button className={styles.continueButton} onClick={handleContinue}>
              Đã Hiểu
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
  
  