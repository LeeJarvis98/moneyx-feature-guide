'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@mantine/core';
import Image from 'next/image';
import PartnerLogin from './PartnerLogin';
import PartnerDashboard from './PartnerDashboard';
import PartnerAgreement from './PartnerAgreement';
import WelcomeScreen from './WelcomeScreen';
import { exnessApi } from '@/lib/exness/api';
import styles from './PartnerApp.module.css';

interface PartnerAppProps {
  onAsideContentChange?: (content: React.ReactNode) => void;
  selectedPlatform: string | null;
  onPlatformSelect: (platform: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  onAgreementVisibilityChange?: (visible: boolean) => void;
  partnerRank?: string;
  loadingPlatforms?: boolean;
}

export default function PartnerApp({ onAsideContentChange, selectedPlatform, onPlatformSelect, isAuthenticated, setIsAuthenticated, onAgreementVisibilityChange, partnerRank, loadingPlatforms }: PartnerAppProps) {
  const [checking, setChecking] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  // Check if user has partner rank badge (means they're already a partner)
  // ADMIN users should also skip the agreement and go directly to login
  const hasPartnerRank = partnerRank && partnerRank !== 'None' && partnerRank !== 'ADMIN';
  const isAdmin = partnerRank === 'ADMIN';
  const [isPartner, setIsPartner] = useState(!!hasPartnerRank || isAdmin);
  const [checkingPartnerStatus, setCheckingPartnerStatus] = useState(false);
  const [hasSelectedPlatforms, setHasSelectedPlatforms] = useState<boolean | null>(null);

  // Function to check partner status from Google Sheets
  const checkPartnerStatus = async (partnerId: string) => {
    try {
      const response = await fetch('/api/check-partner-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsPartner(data.isPartner);
        console.log('[PartnerApp] Partner status:', data.isPartner, 'Rank:', data.rank);
        return data.isPartner;
      }
    } catch (error) {
      console.error('[PartnerApp] Error checking partner status:', error);
    }
    return false;
  };

  // Check if user has selected platforms in database
  useEffect(() => {
    const checkSelectedPlatforms = async () => {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!userId) {
        setHasSelectedPlatforms(null);
        return;
      }

      // Simulate progress for better UX
      setLoadingProgress(30);

      try {
        const response = await fetch('/api/get-selected-platforms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partnerId: userId }),
        });

        setLoadingProgress(60);

        if (response.ok) {
          const data = await response.json();
          const platforms = data.selectedPlatforms || [];
          console.log('[PartnerApp] User has selected platforms:', platforms.length > 0, platforms);
          setHasSelectedPlatforms(platforms.length > 0);
          setLoadingProgress(100);
        } else {
          setHasSelectedPlatforms(null);
          setLoadingProgress(100);
        }
      } catch (error) {
        console.error('[PartnerApp] Error checking selected platforms:', error);
        setHasSelectedPlatforms(null);
        setLoadingProgress(100);
      }
    };

    // Only check when platform loading completes
    if (!loadingPlatforms) {
      checkSelectedPlatforms();
    } else {
      // Simulate initial loading progress
      setLoadingProgress(10);
    }
  }, [loadingPlatforms]);

  // Check if user is already a partner and if authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoadingProgress(20);
      const token = exnessApi.getToken();
      const partnerId = sessionStorage.getItem('partnerId');
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      setLoadingProgress(40);
      
      // If user has partner rank badge or is ADMIN, they're already a partner - skip check
      if (hasPartnerRank || isAdmin) {
        setIsPartner(true);
        console.log('[PartnerApp] User has partner rank badge or is ADMIN, skipping partner status check');
      } else {
        // If user doesn't have a badge, they're definitely not a partner
        // Set to false immediately to avoid showing PartnerLogin briefly
        console.log('[PartnerApp] No partner rank badge, user is not a partner');
        setIsPartner(false);
      }
      
      setLoadingProgress(70);
      
      if (token) {
        try {
          // Verify token is valid by making a test request
          await exnessApi.getTokenInfo();
          setIsAuthenticated(true);
          setLoadingProgress(100);
        } catch (error) {
          // Token is invalid, clear it
          exnessApi.clearToken();
          setIsAuthenticated(false);
          setLoadingProgress(100);
        }
      } else {
        setLoadingProgress(100);
      }
      setChecking(false);
    };

    checkAuth();
  }, [setIsAuthenticated, hasPartnerRank, isAdmin]);

  // Clear aside content when not authenticated
  useEffect(() => {
    if (!isAuthenticated && onAsideContentChange) {
      onAsideContentChange(null);
    }
  }, [isAuthenticated, onAsideContentChange]);

  // Clear aside content when checking completes and user is not authenticated
  useEffect(() => {
    if (!checking && !isAuthenticated && onAsideContentChange) {
      onAsideContentChange(null);
    }
  }, [checking, isAuthenticated, onAsideContentChange]);

  const handleLogout = () => {
    exnessApi.clearToken();
    sessionStorage.removeItem('partnerId');
    sessionStorage.removeItem('platformToken');
    setIsAuthenticated(false);
    // Don't set isPartner to false - they're still a partner, just not authenticated
    // This ensures they go back to PartnerLogin, not PartnerAgreement
  };

  const handleAcceptTerms = async () => {
    // When user accepts terms, proceed to login
    // After they log in, the partner status will be checked again
    setIsPartner(true);
    if (onAgreementVisibilityChange) {
      onAgreementVisibilityChange(false);
    }
  };

  // Notify parent about agreement visibility
  useEffect(() => {
    if (onAgreementVisibilityChange) {
      const showingAgreement = !checking && !isAuthenticated && !isPartner;
      onAgreementVisibilityChange(showingAgreement);
    }
  }, [checking, isAuthenticated, isPartner, onAgreementVisibilityChange]);

  if (checking || loadingPlatforms || hasSelectedPlatforms === null) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <Image
            src="/vnclc-logo.png"
            alt="VNCLC Logo"
            width={181}
            height={40}
            priority
            className={styles.loadingLogo}
          />
          
          <div className={styles.loadingText}>
            {loadingPlatforms ? 'Đang tải thông tin sàn...' : 
             hasSelectedPlatforms === null ? 'Đang kiểm tra tài khoản...' : 
             'Đang xác thực...'}
          </div>
          
          <div className={styles.progressContainer}>
            <Progress
              value={loadingProgress}
              size="md"
              radius="xl"
              color="rgba(255, 184, 28, 1)"
              animated
              className={styles.progress}
            />
          </div>
        </div>
      </div>
    );
  }

  // Get userId for PartnerAgreement
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';

  return (
    <>
      {isAuthenticated ? (
        <PartnerDashboard 
          onLogout={handleLogout} 
          onAsideContentChange={onAsideContentChange}
        />
      ) : isPartner ? (
        !hasSelectedPlatforms ? (
          <WelcomeScreen />
        ) : selectedPlatform ? (
          <PartnerLogin 
            onLoginSuccess={() => setIsAuthenticated(true)} 
            selectedPlatform={selectedPlatform}
            onAsideContentChange={onAsideContentChange}
          />
        ) : (
          <div className={styles.noPlatformMessage}>
            <h3>Vui lòng chọn một sàn</h3>
            <p>Nhấp vào một sàn trong thanh điều hướng để đăng nhập.</p>
          </div>
        )
      ) : (
        <PartnerAgreement 
          onAccept={handleAcceptTerms}
          selectedPlatform={selectedPlatform}
          onPlatformSelect={onPlatformSelect}
          userId={userId || ''}
        />
      )}
    </>
  );
}
