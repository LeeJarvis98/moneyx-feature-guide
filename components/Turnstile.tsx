'use client';

import { Turnstile as CloudflareTurnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, useEffect } from 'react';
import styles from './Turnstile.module.css';

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function Turnstile({ onSuccess, onError, onExpire, className }: TurnstileProps) {
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Get site key from environment variable
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    // Reset turnstile on unmount
    return () => {
      turnstileRef.current?.reset();
    };
  }, []);

  if (!siteKey) {
    console.error('NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured');
    return (
      <div className={styles.errorMessage}>
        Captcha not configured. Please add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your environment.
      </div>
    );
  }

  return (
    <CloudflareTurnstile
      ref={turnstileRef}
      siteKey={siteKey}
      onSuccess={onSuccess}
      onError={() => {
        console.error('Turnstile error');
        onError?.();
      }}
      onExpire={() => {
        console.warn('Turnstile token expired');
        onExpire?.();
      }}
      options={{
        theme: 'dark',
        size: 'normal',
      }}
      className={className}
    />
  );
}
