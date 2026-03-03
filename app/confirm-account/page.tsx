'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

type Status = 'loading' | 'success' | 'already_active' | 'expired' | 'error';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || !type) {
      setStatus('error');
      setMessage('Liên kết xác nhận không hợp lệ.');
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(
          `/api/confirm-partner-agreement?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`
        );
        const data = await res.json();

        if (!res.ok) {
          setStatus(res.status === 410 ? 'expired' : 'error');
          setMessage(data.error || 'Có lỗi xảy ra.');
          return;
        }

        setStatus(data.alreadyActive ? 'already_active' : 'success');
        setMessage(data.message || 'Thành công!');
      } catch {
        setStatus('error');
        setMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    };

    confirm();
  }, [searchParams]);

  const handleGoHome = () => router.push('/');

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Brand */}
        <div className={styles.brand}>
          <p className={styles.brandName}>VNCLC · Tradi Partner</p>
        </div>

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <h2 className={styles.loadingTitle}>Đang xác nhận...</h2>
            <p className={styles.loadingSubtitle}>Vui lòng chờ trong giây lát.</p>
          </>
        )}

        {(status === 'success' || status === 'already_active') && (
          <>
            <div className={styles.statusEmoji}>✅</div>
            <h2 className={styles.successTitle}>
              {status === 'already_active' ? 'Tài khoản đã kích hoạt' : 'Xác nhận thành công!'}
            </h2>
            <p className={styles.successText}>
              {status === 'already_active'
                ? 'Tài khoản đối tác của bạn đã được kích hoạt trước đó. Bạn có thể đăng nhập vào giao diện Đối Tác ngay bây giờ.'
                : 'Bạn đã đọc và xác nhận Hợp Đồng Đối Tác Tradi thành công. Tài khoản đối tác của bạn đã được kích hoạt.'}
            </p>
            <div className={styles.successBox}>
              <p className={styles.successBoxText}>
                🎉 Bạn có thể đóng trang này và quay lại hệ thống để đăng nhập vào giao diện <strong>Đối Tác</strong>.
              </p>
            </div>
            <button className={styles.btnPrimary} onClick={handleGoHome}>
              Về trang chính
            </button>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className={styles.statusEmoji}>⏰</div>
            <h2 className={styles.expiredTitle}>Liên kết đã hết hạn</h2>
            <p className={styles.expiredText}>{message}</p>
            <div className={styles.expiredBox}>
              <p className={styles.expiredBoxText}>
                Vui lòng liên hệ bộ phận hỗ trợ để nhận được liên kết xác nhận mới.
              </p>
            </div>
            <button className={styles.btnSecondary} onClick={handleGoHome}>
              Về trang chính
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.statusEmoji}>❌</div>
            <h2 className={styles.errorTitle}>Xác nhận thất bại</h2>
            <p className={styles.errorText}>{message}</p>
            <button className={styles.btnSecondary} onClick={handleGoHome}>
              Về trang chính
            </button>
          </>
        )}

        <p className={styles.footer}>
          © {new Date().getFullYear()} VNCLC · Tradi. Mọi quyền được bảo lưu.
        </p>
      </div>
    </div>
  );
}

export default function ConfirmAccountPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.fallback}>
          <div className={styles.fallbackText}>Đang tải...</div>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
