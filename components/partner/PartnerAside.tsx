'use client';

import { useState, useEffect } from 'react';
import styles from './PartnerAside.module.css';

interface PlatformRefLinks {
  exness: string;
  binance: string;
  bingx: string;
  bitget: string;
  bybit: string;
  gate: string;
  htx: string;
  kraken: string;
  kucoin: string;
  mexc: string;
  okx: string;
  upbit: string;
}

interface PartnerAsideProps {
  partnerId: string;
  onRefLinksChange?: (refLinks: PlatformRefLinks) => void;
}

const PLATFORMS = [
  { key: 'exness', label: 'Exness' },
  { key: 'binance', label: 'Binance' },
  { key: 'bingx', label: 'BingX' },
  { key: 'bitget', label: 'BitGet' },
  { key: 'bybit', label: 'Bybit' },
  { key: 'gate', label: 'Gate.io' },
  { key: 'htx', label: 'HTX' },
  { key: 'kraken', label: 'Kraken' },
  { key: 'kucoin', label: 'KuCoin' },
  { key: 'mexc', label: 'MEXC' },
  { key: 'okx', label: 'OKX' },
  { key: 'upbit', label: 'Upbit' },
] as const;

export default function PartnerAside({ partnerId, onRefLinksChange }: PartnerAsideProps) {
  const [refLinks, setRefLinks] = useState<PlatformRefLinks>({
    exness: '',
    binance: '',
    bingx: '',
    bitget: '',
    bybit: '',
    gate: '',
    htx: '',
    kraken: '',
    kucoin: '',
    mexc: '',
    okx: '',
    upbit: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load existing ref links on mount
  useEffect(() => {
    if (!isMounted || !partnerId) return;

    const loadRefLinks = async () => {
      try {
        const response = await fetch(`/api/get-partner-ref-links?partnerId=${partnerId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load referral links: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.refLinks) {
          setRefLinks(data.refLinks);
          if (onRefLinksChange) {
            onRefLinksChange(data.refLinks);
          }
        }
      } catch (err) {
        console.error('Error loading ref links:', err);
        setError('Failed to load referral links. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadRefLinks();
  }, [partnerId, isMounted, onRefLinksChange]);

  const handleInputChange = (platform: string, value: string) => {
    // Auto-prepend https:// if not present
    let processedValue = value.trim();
    if (processedValue && !processedValue.startsWith('http://') && !processedValue.startsWith('https://')) {
      processedValue = 'https://' + processedValue;
    }
    
    const updatedLinks = {
      ...refLinks,
      [platform]: processedValue,
    };
    setRefLinks(updatedLinks);
    if (onRefLinksChange) {
      onRefLinksChange(updatedLinks);
    }
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/update-partner-ref-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          refLinks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save referral links');
      }

      setSuccess(true);
      setIsEditMode(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>Platform Referral Links</h3>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={styles.editButton}
            disabled={saving}
          >
            {isEditMode ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <p className={styles.subtitle}>
          {isEditMode ? 'Edit your referral links for each platform' : 'View your referral links for each platform'}
        </p>
      </div>

      <div className={styles.formContainer}>
        {PLATFORMS.map(({ key, label }) => (
          <div key={key} className={styles.inputGroup}>
            <label htmlFor={key} className={styles.label}>
              {label}
            </label>
            <input
              type="url"
              id={key}
              value={refLinks[key as keyof PlatformRefLinks]}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={`Enter ${label} referral link`}
              className={styles.input}
              disabled={saving || !isEditMode}
              readOnly={!isEditMode}
            />
          </div>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>Referral links saved successfully!</div>}

      {isEditMode && (
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      )}
    </div>
  );
}
