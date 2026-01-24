'use client';

import { useState, useEffect } from 'react';
import PartnerLogin from './PartnerLogin';
import PartnerDashboard from './PartnerDashboard';
import PartnerAgreement from './PartnerAgreement';
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
}

export default function PartnerApp({ onAsideContentChange, selectedPlatform, onPlatformSelect, isAuthenticated, setIsAuthenticated, onAgreementVisibilityChange, partnerRank }: PartnerAppProps) {
  const [checking, setChecking] = useState(true);
  // Check if user has partner rank badge (means they're already a partner)
  // ADMIN users should also skip the agreement and go directly to login
  const hasPartnerRank = partnerRank && partnerRank !== 'None' && partnerRank !== 'ADMIN';
  const isAdmin = partnerRank === 'ADMIN';
  const [isPartner, setIsPartner] = useState(!!hasPartnerRank || isAdmin);
  const [checkingPartnerStatus, setCheckingPartnerStatus] = useState(false);

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

  // Check if user is already a partner and if authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = exnessApi.getToken();
      const partnerId = sessionStorage.getItem('partnerId');
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
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
      
      if (token) {
        try {
          // Verify token is valid by making a test request
          await exnessApi.getTokenInfo();
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          exnessApi.clearToken();
          setIsAuthenticated(false);
        }
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

  if (checking) {
    return (
      <div className={styles.checkingAuth}>
        Checking authentication...
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
        <PartnerLogin 
          onLoginSuccess={() => setIsAuthenticated(true)} 
          selectedPlatform={selectedPlatform}
          onAsideContentChange={onAsideContentChange}
        />
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
