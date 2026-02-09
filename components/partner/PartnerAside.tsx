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
  { key: 'exness', label: 'Exness', logo: '/getbot_section/exness.png' },
  { key: 'binance', label: 'Binance', logo: '/getbot_section/binance.png' },
  { key: 'bingx', label: 'BingX', logo: '/getbot_section/bingx.png' },
  { key: 'bitget', label: 'BitGet', logo: '/getbot_section/bitget.png' },
  { key: 'bybit', label: 'Bybit', logo: '/getbot_section/bybit.png' },
  { key: 'gate', label: 'Gate.io', logo: '/getbot_section/gate.png' },
  { key: 'htx', label: 'HTX', logo: null },
  { key: 'kraken', label: 'Kraken', logo: null },
  { key: 'kucoin', label: 'KuCoin', logo: null },
  { key: 'mexc', label: 'MEXC', logo: '/getbot_section/mexc.png' },
  { key: 'okx', label: 'OKX', logo: '/getbot_section/okx.png' },
  { key: 'upbit', label: 'Upbit', logo: null },
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
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [supportLink, setSupportLink] = useState('');
  const [isSupportEditMode, setIsSupportEditMode] = useState(false);
  const [originalRefLinks, setOriginalRefLinks] = useState<PlatformRefLinks>({
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
  const [originalSupportLink, setOriginalSupportLink] = useState('');

  // Ensure we're on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load selected platforms to filter which ref links to show
  useEffect(() => {
    if (!isMounted || !partnerId) {
      setLoadingPlatforms(false);
      return;
    }

    const loadSelectedPlatforms = async () => {
      try {
        setLoadingPlatforms(true);
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

        console.log('[PartnerAside] Loaded selected platforms:', platforms);
        setSelectedPlatforms(platforms);
        setHasLoadedData(true);
      } catch (error) {
        console.error('[PartnerAside] Error loading selected platforms:', error);
        // On error, show all platforms
        setSelectedPlatforms([]);
        setHasLoadedData(false);
      } finally {
        setLoadingPlatforms(false);
      }
    };

    loadSelectedPlatforms();
  }, [partnerId, isMounted]);

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
          setOriginalRefLinks(data.refLinks);
          if (onRefLinksChange) {
            onRefLinksChange(data.refLinks);
          }
        }
        if (data.supportLink) {
          setSupportLink(data.supportLink);
          setOriginalSupportLink(data.supportLink);
        }
      } catch (err) {
        console.error('Error loading ref links:', err);
        setError('Không thể tải link giới thiệu. Vui lòng làm mới trang.');
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

  const handleSupportLinkChange = (value: string) => {
    // Auto-prepend https:// if not present
    let processedValue = value.trim();
    if (processedValue && !processedValue.startsWith('http://') && !processedValue.startsWith('https://')) {
      processedValue = 'https://' + processedValue;
    }
    setSupportLink(processedValue);
    setSuccess(false);
    setError(null);
  };

  const hasChanges = () => {
    // Check if support link has changed
    const supportLinkChanged = supportLink !== originalSupportLink;

    // Check if any ref link has changed
    const refLinksChanged = Object.keys(refLinks).some(
      key => refLinks[key as keyof PlatformRefLinks] !== originalRefLinks[key as keyof PlatformRefLinks]
    );

    return supportLinkChanged || refLinksChanged;
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
          supportLink,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save referral links');
      }

      setSuccess(true);
      setIsEditMode(false);
      setIsSupportEditMode(false);
      setOriginalRefLinks(refLinks);
      setOriginalSupportLink(supportLink);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingPlatforms) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  // Filter platforms based on selected platforms
  const visiblePlatforms = !hasLoadedData
    ? PLATFORMS // Show all platforms if data hasn't been loaded yet
    : selectedPlatforms.length > 0
      ? PLATFORMS.filter(p => selectedPlatforms.includes(p.key))
      : []; // Show nothing if loaded data is empty array

  return (
    <div className={styles.container}>
      {/* Support Link Section */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>Link Hỗ Trợ Khách</h3>
          <button
            onClick={() => {
              if (isSupportEditMode) {
                setSupportLink(originalSupportLink);
              }
              setIsSupportEditMode(!isSupportEditMode);
            }}
            className={styles.editButton}
            disabled={saving}
          >
            {isSupportEditMode ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>
        <div className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <input
              type="url"
              id="support-link"
              value={supportLink}
              onChange={(e) => handleSupportLinkChange(e.target.value)}
              placeholder="Nhập link hỗ trợ khách hàng (Telegram, WhatsApp, etc.)"
              className={styles.input}
              disabled={saving || !isSupportEditMode}
              readOnly={!isSupportEditMode}
            />
          </div>
        </div>
      </div>

      {/* Referral Links Section */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>Link Giới Thiệu Sàn</h3>
          <button
            onClick={() => {
              if (isEditMode) {
                setRefLinks(originalRefLinks);
              }
              setIsEditMode(!isEditMode);
            }}
            className={styles.editButton}
            disabled={saving}
          >
            {isEditMode ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>
        <div className={styles.formContainer}>
          {visiblePlatforms.length > 0 ? (
            visiblePlatforms.map(({ key, label, logo }) => (
              <div key={key} className={styles.inputGroup}>
                <div className={styles.inputWrapper}>
                  {logo ? (
                    <img
                      src={logo}
                      alt={label}
                      className={styles.platformLogo}
                    />
                  ) : (
                    <span className={styles.platformLabel}>{label}</span>
                  )}
                  <input
                    type="url"
                    id={key}
                    value={refLinks[key as keyof PlatformRefLinks]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={`Nhập link giới thiệu ${label}`}
                    className={styles.input}
                    disabled={saving || !isEditMode}
                    readOnly={!isEditMode}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>Chưa chọn sàn nào</p>
              <p className={styles.emptyStateHint}>
                Vui lòng chọn sàn trong thanh điều hướng để thêm link giới thiệu
              </p>
            </div>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>Lưu thành công!</div>}

      {(isEditMode || isSupportEditMode) && hasChanges() && (
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      )}
    </div>
  );
}
