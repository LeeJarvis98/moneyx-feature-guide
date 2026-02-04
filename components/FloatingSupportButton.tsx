'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';
import styles from './FloatingSupportButton.module.css';

export default function FloatingSupportButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [partnerSupportLink, setPartnerSupportLink] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastSupportLinkRef = useRef<string | null>(null);

  // Get partner support link from sessionStorage
  useEffect(() => {
    const checkPartnerData = () => {
      const partnerPlatformData = sessionStorage.getItem('partnerPlatformData');
      if (partnerPlatformData) {
        try {
          const data = JSON.parse(partnerPlatformData);
          const newSupportLink = data.supportLink || null;
          
          // Only update and log if the support link has changed
          if (newSupportLink !== lastSupportLinkRef.current) {
            console.log('[FloatingSupportButton] Partner support link changed:', newSupportLink);
            lastSupportLinkRef.current = newSupportLink;
            setPartnerSupportLink(newSupportLink);
          }
        } catch (error) {
          console.error('Error parsing partner platform data:', error);
          if (lastSupportLinkRef.current !== null) {
            lastSupportLinkRef.current = null;
            setPartnerSupportLink(null);
          }
        }
      } else {
        if (lastSupportLinkRef.current !== null) {
          lastSupportLinkRef.current = null;
          setPartnerSupportLink(null);
        }
      }
    };

    // Check immediately
    checkPartnerData();

    // Listen for updates to partner platform data (cross-window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'partnerPlatformData') {
        checkPartnerData();
      }
    };

    // Listen for focus events to check if data was updated
    const handleFocus = () => {
      checkPartnerData();
    };

    // Poll for changes (for same-window updates)
    const interval = setInterval(checkPartnerData, 1000);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleCloseMenu = () => {
    setIsMenuClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }, 200); // Match animation duration
  };

  const handleToggleMenu = () => {
    if (isMenuOpen) {
      handleCloseMenu();
    } else {
      setIsMenuOpen(true);
    }
  };

  return (
    <div className={styles.container} ref={menuRef}>
      {/* Menu */}
      {isMenuOpen && (
        <div className={`${styles.menu} ${isMenuClosing ? styles.menuClosing : ''}`}>
          <Link
            href="https://zalo.me/0353522252/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.menuItem}
            onClick={() => handleCloseMenu()}
          >
            <Image 
              src="/tradi-logo-solid.png" 
              alt="Tradi Logo" 
              width={20} 
              height={20} 
              className={styles.menuIcon}
            />
            <span>Liên hệ Tradi</span>
          </Link>

          {partnerSupportLink && (
            <>
              <div className={styles.menuDivider} />
              <Link
                href={partnerSupportLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.menuItem}
                onClick={() => handleCloseMenu()}
              >
                <Users size={20} className={styles.menuIcon} />
                <span>Liên hệ Đối tác</span>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Support Button */}
      <button
        onClick={handleToggleMenu}
        className={styles.supportButton}
        aria-label="Liên hệ hỗ trợ"
        title="Liên hệ hỗ trợ"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.icon}
        >
          <path
            d="M21 11.5C21 16.75 16.75 21 11.5 21C6.25 21 2 16.75 2 11.5C2 6.25 6.25 2 11.5 2C16.75 2 21 6.25 21 11.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 16V12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 8H12.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.text}>Hỗ trợ</span>
      </button>
    </div>
  );
}
