'use client';

import { useState } from 'react';
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
}

export default function PartnerNavBar({ selectedPlatform, onPlatformSelect }: PartnerNavBarProps) {
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

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
      <h3 className={styles.title}>Chọn Sàn Giao Dịch</h3>
      <div className={styles.platformGrid}>
        {tradingPlatforms.map((platform) => (
          <div
            key={platform.value}
            className={`${styles.platformCard} ${
              selectedPlatform === platform.value ? styles.selected : ''
            } ${platform.disabled ? styles.disabled : ''}`}
            onClick={() => !platform.disabled && onPlatformSelect(platform.value)}
            onMouseEnter={() => !platform.disabled && setHoveredPlatform(platform.value)}
            onMouseLeave={() => setHoveredPlatform(null)}
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
            {selectedPlatform === platform.value && (
              <div className={styles.selectedBadge}>✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
