'use client';

import { Turnstile as CloudflareTurnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import styles from './Turnstile.module.css';

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export interface TurnstileHandle {
  reset: () => void;
}

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { onSuccess, onError, onExpire, className },
  ref
) {
  const turnstileRef = useRef<TurnstileInstance>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      turnstileRef.current?.reset();
    },
  }));

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
});
