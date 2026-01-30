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
  onLoadingChange?: (loading: boolean) => void;
}

export default function PartnerNavBar({ selectedPlatform, onPlatformSelect, isAuthenticated, onLogout, onLoadingChange }: PartnerNavBarProps) {
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null);
  const [showAddPlatformModal, setShowAddPlatformModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [savingPlatforms, setSavingPlatforms] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Get partnerId from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      setPartnerId(storedUserId);
    }
  }, []);

  // Function to load platforms from database (reusable)
  const loadPlatformsFromDatabase = async () => {
    if (!partnerId) {
      setLoadingPlatforms(false);
      setSelectedPlatforms([]);
      setHasLoadedData(false);
      onLoadingChange?.(false);
      return;
    }

    try {
      setLoadingPlatforms(true);
      onLoadingChange?.(true);
      const response = await fetch('/api/get-selected-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch selected platforms');
      }

      const data = await response.json();
      const platforms = data.selectedPlatforms || [];
      
      console.log('[PartnerNavBar] Loaded selected platforms:', platforms);
      setSelectedPlatforms(platforms);
      setHasLoadedData(true);
    } catch (error) {
      console.error('[PartnerNavBar] Error loading selected platforms:', error);
      // On error, show empty array and mark as not loaded
      setSelectedPlatforms([]);
      setHasLoadedData(false);
    } finally {
      setLoadingPlatforms(false);
      onLoadingChange?.(false);
    }
  };

  // Load selected platforms from database when partnerId is available
  useEffect(() => {
    loadPlatformsFromDatabase();
  }, [partnerId]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModal) {
          handleCancelSwitch();
        }
        if (showAddPlatformModal) {
          setShowAddPlatformModal(false);
        }
      }
    };
    
    if (showModal || showAddPlatformModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal, showAddPlatformModal]);

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

  const handleOpenAddPlatformModal = () => {
    // Modal will show current selection, no need to reset
    setShowAddPlatformModal(true);
  };

  const handleTogglePlatform = (platformValue: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformValue)) {
        return prev.filter(p => p !== platformValue);
      } else {
        return [...prev, platformValue];
      }
    });
  };

  const handleSavePlatforms = async () => {
    if (!partnerId) {
      console.error('[PartnerNavBar] No partner ID found');
      return;
    }

    setSavingPlatforms(true);
    try {
      const response = await fetch('/api/update-selected-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          selectedPlatforms,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update selected platforms');
      }

      console.log('[PartnerNavBar] Successfully saved selected platforms:', selectedPlatforms);
      
      // Reload platforms from database to ensure UI is in sync
      await loadPlatformsFromDatabase();
      
      setShowAddPlatformModal(false);
    } catch (error) {
      console.error('[PartnerNavBar] Error saving platforms:', error);
      alert('Không thể lưu sàn đã chọn. Vui lòng thử lại.');
    } finally {
      setSavingPlatforms(false);
    }
  };

  const handleCancelAddPlatform = async () => {
    setShowAddPlatformModal(false);
    // Reload the original selection from database
    if (partnerId) {
      try {
        const response = await fetch('/api/get-selected-platforms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partnerId }),
        });
        if (response.ok) {
          const data = await response.json();
          setSelectedPlatforms(data.selectedPlatforms || []);
        }
      } catch (error) {
        console.error('[PartnerNavBar] Error reloading platforms:', error);
      }
    }
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
      {/* Add Platform Button - Only shown when NOT authenticated */}
      {!isAuthenticated && partnerId && (
        <div className={styles.addPlatformButtonContainer}>
          <button
            type="button"
            className={styles.addPlatformButton}
            onClick={handleOpenAddPlatformModal}
            aria-label="Add trading platforms"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Thêm sàn</span>
          </button>
        </div>
      )}

      <div className={styles.platformGrid}>
        {/* Show loading state */}
        {loadingPlatforms && partnerId && (
          <div className={styles.loadingMessage}>Đang tải...</div>
        )}
        
        {/* Filter platforms: show selected ones if available, otherwise all non-disabled */}
        {!loadingPlatforms && tradingPlatforms
          .filter(platform => {
            // If we haven't loaded data yet, show all non-disabled platforms
            if (!hasLoadedData) {
              return !platform.disabled;
            }
            // If we have loaded data and have selected platforms, show only those
            if (selectedPlatforms.length > 0) {
              return selectedPlatforms.includes(platform.value);
            }
            // If loaded data is empty array [], don't show any platforms (user explicitly deselected all)
            return false;
          })
          .map((platform) => (
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
        
        {/* Show empty state when user has explicitly selected no platforms (loaded data is empty array) */}
        {!loadingPlatforms && hasLoadedData && selectedPlatforms.length === 0 && (
          <div className={styles.emptyState}>
            <p>Chưa có sàn nào được chọn</p>
            <p className={styles.emptyStateHint}>Nhấn "Thêm sàn" để chọn sàn giao dịch</p>
          </div>
        )}
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

      {/* Modal for adding platforms */}
      {showAddPlatformModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={handleCancelAddPlatform}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-platform-modal-title"
        >
          <div className={styles.addPlatformModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 id="add-platform-modal-title">Chọn sàn giao dịch</h3>
            </div>
            <div className={styles.addPlatformModalBody}>
              <p className={styles.modalDescription}>
                Chọn các sàn giao dịch bạn muốn theo dõi. Bạn có thể chọn nhiều sàn cùng lúc.
              </p>
              <div className={styles.platformSelectGrid}>
                {tradingPlatforms.map((platform) => (
                  <button
                    key={platform.value}
                    type="button"
                    className={`${styles.platformSelectCard} ${styles[`platform_${platform.value}`]} ${
                      selectedPlatforms.includes(platform.value) ? styles.platformSelected : ''
                    } ${platform.disabled ? styles.platformDisabled : ''}`}
                    onClick={() => !platform.disabled && handleTogglePlatform(platform.value)}
                    disabled={platform.disabled}
                    aria-label={`${selectedPlatforms.includes(platform.value) ? 'Deselect' : 'Select'} ${platform.label}`}
                  >
                    <div className={styles.cardContent}>
                      <div className={styles.checkboxIndicator}>
                        {selectedPlatforms.includes(platform.value) && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.platformSelectLabel}>{platform.label}</div>
                      {platform.disabled && (
                        <div className={styles.comingSoonBadge}>Sắp Ra Mắt</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCancelAddPlatform}
                disabled={savingPlatforms}
              >
                Hủy
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSavePlatforms}
                disabled={savingPlatforms || selectedPlatforms.length === 0}
              >
                {savingPlatforms ? 'Đang lưu...' : `Lưu (${selectedPlatforms.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
