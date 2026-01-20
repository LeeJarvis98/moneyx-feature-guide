'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './PartnerNavBar.module.css';

interface Platform {
  value: string;
  label: string;
  disabled: boolean;
  image: string;
}

interface PartnerNavBarProps {
  selectedPlatform: string | null;
  onPlatformSelect: (platform: string) => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export default function PartnerNavBar({ selectedPlatform, onPlatformSelect, isAuthenticated, onLogout }: PartnerNavBarProps) {
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleCancelSwitch();
      }
    };
    
    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal]);

  const handlePlatformClick = (platform: string) => {
    if (isAuthenticated && selectedPlatform && selectedPlatform !== platform) {
      setPendingPlatform(platform);
      setShowModal(true);
    } else {
      onPlatformSelect(platform);
    }
  };

  const handleLogoutAndSwitch = () => {
    if (onLogout) {
      onLogout();
    }
    if (pendingPlatform) {
      onPlatformSelect(pendingPlatform);
    }
    setShowModal(false);
    setPendingPlatform(null);
  };

  const handleCancelSwitch = () => {
    setShowModal(false);
    setPendingPlatform(null);
  };

  const tradingPlatforms: Platform[] = [
    {
      value: 'exness',
      label: 'Exness',
      disabled: false,
      image: '/getbot_section/exness.png',
    },
    {
      value: 'binance',
      label: 'Binance',
      disabled: false,
      image: '/getbot_section/binance.png',
    },
    {
      value: 'bingx',
      label: 'BingX',
      disabled: true,
      image: '/getbot_section/bingx.png',
    },
    {
      value: 'bitget',
      label: 'BitGet',
      disabled: true,
      image: '/getbot_section/bitget.png',
    },
    {
      value: 'bybit',
      label: 'Bybit',
      disabled: true,
      image: '/getbot_section/bybit.png',
    },
    {
      value: 'gate',
      label: 'Gate.io',
      disabled: true,
      image: '/getbot_section/gate.png',
    },
  ];

  return (
    <div className={styles.navbar}>
      <div className={styles.platformGrid}>
        {tradingPlatforms.map((platform) => (
          <button
            key={platform.value}
            type="button"
            className={`${styles.platformCard} ${
              selectedPlatform === platform.value ? styles.selected : ''
            } ${platform.disabled ? styles.disabled : ''}`}
            onClick={() => !platform.disabled && handlePlatformClick(platform.value)}
            onMouseEnter={() => !platform.disabled && setHoveredPlatform(platform.value)}
            onMouseLeave={() => setHoveredPlatform(null)}
            disabled={platform.disabled}
            aria-label={`Select ${platform.label} trading platform`}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={platform.image}
                alt={platform.label}
                width={120}
                height={120}
                className={styles.platformImage}
              />
            </div>
            <div className={styles.platformLabel}>{platform.label}</div>
            {platform.disabled && (
              <div className={styles.comingSoon}>Sắp Ra Mắt</div>
            )}
          </button>
        ))}
      </div>

      {/* Modal for switching platforms */}
      {showModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={handleCancelSwitch}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 id="modal-title">Chuyển đổi sàn giao dịch</h3>
            </div>
            <div className={styles.modalBody}>
              <p>
                Bạn hiện đang đăng nhập vào <strong>{selectedPlatform?.toUpperCase()}</strong>.
              </p>
              <p>
                Chỉ cho phép một phiên làm việc tại một thời điểm. Vui lòng đăng xuất trước khi chuyển sang sàn khác.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCancelSwitch}
              >
                Hủy
              </button>
              <button 
                className={styles.logoutButton}
                onClick={handleLogoutAndSwitch}
              >
                Đăng xuất & Chuyển sàn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
