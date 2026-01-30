'use client';

import Link from 'next/link';
import styles from './FloatingSupportButton.module.css';

export default function FloatingSupportButton() {
  return (
    <Link
      href="https://zalo.me/0353522252/"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.supportButton}
      aria-label="Liên hệ hỗ trợ qua Zalo"
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
    </Link>
  );
}
