'use client';

import { useState, useEffect } from 'react';
import { Text, Alert } from '@mantine/core';
import { Gem, Diamond, Star, Award, Medal, Shield } from 'lucide-react';
import styles from './ChangeForm.module.css';

interface ChangeFormProps {
  autoFetch?: boolean;
  partnerType?: 'DTT' | 'DLHT' | null;
}

const partnerTiers = [
  { name: 'Kim Cương', partner: '95%', tradi: '5%', condition: '2000 Lot', icon: Gem },
  { name: 'Ruby', partner: '90%', tradi: '10%', condition: '1200 lot', icon: Diamond },
  { name: 'Bạch Kim', partner: '85%', tradi: '15%', condition: '600 lot', icon: Star },
  { name: 'Vàng', partner: '80%', tradi: '20%', condition: '300 lot', icon: Award },
  { name: 'Bạc', partner: '75%', tradi: '25%', condition: '100 lot', icon: Medal },
  { name: 'Đồng', partner: '70%', tradi: '30%', condition: 'Hoàn thành', icon: Shield },
];

export default function ChangeForm({ autoFetch = false, partnerType: propPartnerType }: ChangeFormProps) {
  const [currentPartnerType, setCurrentPartnerType] = useState<'DTT' | 'DLHT' | null>(propPartnerType || null);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastChangeDate, setLastChangeDate] = useState<Date | null>(null);

  useEffect(() => {
    if (propPartnerType) {
      setCurrentPartnerType(propPartnerType);
    } else if (autoFetch) {
      fetchCurrentPartnerType();
    }
  }, [autoFetch, propPartnerType]);

  const fetchCurrentPartnerType = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!userId) {
        setError('Không tìm thấy thông tin người dùng');
        return;
      }

      const response = await fetch('/api/check-partner-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.partnerType) {
          setCurrentPartnerType(data.partnerType);
        }
        if (data.partnerTypeChangeDate) {
          setLastChangeDate(new Date(data.partnerTypeChangeDate));
        }
      } else {
        setError('Không thể tải thông tin đối tác');
      }
    } catch (error) {
      console.error('Error fetching partner type:', error);
      setError('Không thể tải thông tin đối tác');
    } finally {
      setLoading(false);
    }
  };

  const canChangePartnerType = () => {
    if (!lastChangeDate) return true;

    const daysSinceLastChange = Math.floor(
      (new Date().getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLastChange >= 30;
  };

  const getDaysUntilCanChange = () => {
    if (!lastChangeDate) return 0;

    const daysSinceLastChange = Math.floor(
      (new Date().getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, 30 - daysSinceLastChange);
  };

  const handleConfirm = () => {
    if (hasRead && hasAgreed) {
      setHasConfirmed(true);
      setShowTermsModal(false);
    }
  };

  const handlePartnerTypeChange = async (newType: 'DTT' | 'DLHT') => {
    if (!hasConfirmed || loading || newType === currentPartnerType) return;

    // First click - show confirmation button
    if (!showConfirmButton) {
      setShowConfirmButton(true);
      return;
    }

    // Second click - execute the change
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!userId) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      const response = await fetch('/api/update-partner-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, partnerType: newType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update partner type');
      }

      setCurrentPartnerType(data.partnerType);
      if (data.changeDate) {
        setLastChangeDate(new Date(data.changeDate));
      }
      setSuccess(true);
      setHasConfirmed(false);
      setHasRead(false);
      setHasAgreed(false);
      setShowConfirmButton(false);

      // Refresh the page or update parent component to reflect changes
      setTimeout(() => {
        setSuccess(false);
        // Optionally reload to update the header badge
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error changing partner type:', error);
      setError(error instanceof Error ? error.message : 'Không thể đổi hình thức');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateChange = (newType: 'DTT' | 'DLHT') => {
    if (!hasConfirmed || loading || newType === currentPartnerType || !canChange) return;
    setShowConfirmButton(true);
  };

  const handleCancelChange = () => {
    setShowConfirmButton(false);
  };

  const canChange = canChangePartnerType();
  const daysUntilCanChange = getDaysUntilCanChange();

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Đổi hình thức đối tác</h2>
        <div className={styles.currentTypeInfo}>
          <span className={styles.currentTypeLabel}>Hình thức hiện tại: </span>
          <strong className={styles.currentTypeValue}>
            {currentPartnerType === 'DTT' ? 'ĐỐI TÁC TRADI' : currentPartnerType === 'DLHT' ? 'ĐẠI LÍ HỆ THỐNG' : 'Chưa xác định'}
          </strong>
        </div>
      </div>

      {loading && <div className={styles.loading}>Đang tải...</div>}

      <div className={styles.content}>
        {/* Change restriction warning */}
        {!canChange && (
          <Alert className={styles.warningAlert} color="orange" title="Hạn chế đổi hình thức">
            Bạn chỉ có thể đổi hình thức sau mỗi 30 ngày.
            Còn <strong>{daysUntilCanChange} ngày</strong> nữa để có thể đổi.
          </Alert>
        )}

        {/* Success message */}
        {success && (
          <Alert className={styles.successAlert} color="green" title="Thành công">
            Đã đổi hình thức thành công!
          </Alert>
        )}

        {/* Error message */}
        {error && (
          <Alert className={styles.errorAlert} color="red" title="Lỗi">
            {error}
          </Alert>
        )}

        {/* Partner Tiers Table */}
        <div className={styles.tableContainer}>
          <h3 className={styles.tableTitle}>HOA HỒNG ĐỐI TÁC</h3>
          <p className={styles.tableDescription}>
            Đối tác được hưởng hoa hồng theo 6 cấp độ và chia sẻ phí dịch vụ Tradi khi giới thiệu thành công Bot VNCLC cho user mới.
          </p>

          {/* Table Header */}
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>CẤP ĐỘ</div>
            <div className={styles.headerCell}>ĐỐI TÁC</div>
            <div className={styles.headerCell}>TRADI</div>
            <div className={styles.headerCell}>ĐIỀU KIỆN</div>
          </div>

          {/* Table Body */}
          <div className={styles.tableBody}>
            {partnerTiers.map((tier, index) => {
              const IconComponent = tier.icon;
              return (
                <div key={index} className={styles.tableRow}>
                  <div className={styles.tableCell}>
                    <IconComponent size={18} className={styles.tierIcon} />
                    <span className={styles.tierName}>{tier.name}</span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.percentage}>{tier.partner}</span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.tradiPercentage}>{tier.tradi}</span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.conditionText}>{tier.condition}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terms Button */}
        <button
          className={`${styles.termsButton} ${!hasConfirmed ? styles.breathing : ''}`}
          onClick={() => setShowTermsModal(true)}
        >
          Điều khoản hợp tác & bảo mật
        </button>

        <div className={styles.notice}>
          <Text size="xs" c="dimmed">
            <strong>Lưu ý:</strong> Bạn chỉ có thể đổi hình thức sau mỗi 30 ngày. Vui lòng đọc kỹ điều khoản trước khi thực hiện thay đổi.
          </Text>
        </div>

        {/* Partner Type Selection Buttons */}
        {!showConfirmButton ? (
          <div className={styles.buttonGrid}>
            {/* Show DTT button only if user is DLHT */}
            {currentPartnerType === 'DLHT' && (
              <div className={styles.partnerOption}>
                <div className={styles.commissionInfo}>
                  <h4 className={styles.commissionTitle}>Đối tác Tradi</h4>
                  <p className={styles.commissionDetail}>Hoa hồng: <strong>70%</strong></p>
                  <p className={styles.commissionNote}>(có thể nâng cấp)</p>
                </div>
                <button
                  className={styles.partnerButton}
                  onClick={() => handleInitiateChange('DTT')}
                  disabled={!hasConfirmed || loading || !canChange}
                >
                  {loading ? 'Đang đổi...' : 'Chuyển đổi'}
                </button>
              </div>
            )}

            {/* Show DLHT button only if user is DTT */}
            {currentPartnerType === 'DTT' && (
              <div className={styles.partnerOption}>
                <div className={styles.commissionInfo}>
                  <h4 className={styles.commissionTitle}>Đại lý Hệ thống</h4>
                  <p className={styles.commissionDetail}>Hoa hồng hệ thống: <strong>90%</strong></p>
                  <p className={styles.commissionNote}>(chỉ nâng khi hệ thống nâng cấp)</p>
                </div>
                <button
                  className={styles.partnerButton}
                  onClick={() => handleInitiateChange('DLHT')}
                  disabled={!hasConfirmed || loading || !canChange}
                >
                  {loading ? 'Đang đổi...' : 'Chuyển đổi'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.confirmButtonContainer}>
            <button
              className={styles.confirmChangeButton}
              onClick={() => handlePartnerTypeChange(currentPartnerType === 'DTT' ? 'DLHT' : 'DTT')}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Tôi xác nhận muốn chuyển đổi hình thức'}
            </button>
            <button
              className={styles.cancelButton}
              onClick={handleCancelChange}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        )}
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTermsModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setShowTermsModal(false)}
            >
              ✕
            </button>

            <div className={styles.termsSection}>
              <h3 className={styles.termsTitle}>Điều khoản hợp tác & bảo mật</h3>

              <div className={styles.termsContent}>
                <h4 className={styles.termsSectionTitle}>ĐỐI TÁC:</h4>
                <ol className={styles.termsList}>
                  <li>Mọi thông tin liên quan đến khách hàng, tài khoản giao dịch đều được bảo mật tuyệt đối.</li>
                  <li>Mọi hành vi vi phạm bảo mật gây thiệt hại sẽ hoàn toàn chịu trách nhiệm pháp lý.</li>
                  <li>Bot VNCLC là Bot miễn phí, chỉ được chia sẻ Link Ref công đồng, không MUA - BÁN.</li>
                  <li>Đối tác phải đạt cấp Bạc trở lên mới có thể sử dụng Partner System tìm nhanh dưới.</li>
                  <li>Đối tác cung cấp Link Ref sàn và thông tin liên hệ để Tradi tạo hệ thống trên website.</li>
                </ol>

                <h4 className={styles.termsSectionTitle}>ĐẠI LÍ ĐƯỢC GIỚI THIỆU :</h4>
                <ol className={styles.termsList}>
                  <li>Đại lí có thể chuyển đổi đại lí hệ thống khác (sau mỗi 30 ngày).</li>
                  <li>Đại lí có thể chuyển đổi thức đại lí hệ thống thành đối tác mới (sau mỗi 30 ngày).</li>
                  <li>Đối tác mới (có thể tăng cấp được):</li>
                  <li className={styles.subItem}>+ Bắt đầu từ cấp độ Đồng 70%, chia sẻ hoa hồng cho người giới thiệu đến khi bằng cấp độ.</li>
                  <li className={styles.subItem}>+ Khi bằng cấp độ, đối tác "không còn" trong hệ thống được giới thiệu nữa.</li>
                  <li>Đại lí hệ thống (không tự thăng cấp được):</li>
                  <li className={styles.subItem}>+ Hoa hồng luôn dưới hệ thống tổng 1 bậc.</li>
                  <li className={styles.subItem}>+ Hệ thống tổng tăng lên 1 cấp, đại lí hệ thống được tăng theo 1 cấp.</li>
                </ol>
              </div>

              {/* Checkboxes */}
              <div className={styles.checkboxContainer}>
                <div className={styles.checkboxWrapper}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasRead}
                      onChange={(e) => {
                        setHasRead(e.target.checked);
                        if (!e.target.checked) {
                          setHasConfirmed(false);
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <span>Tôi đã đọc và hiểu</span>
                  </label>

                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasAgreed}
                      onChange={(e) => {
                        setHasAgreed(e.target.checked);
                        if (!e.target.checked) {
                          setHasConfirmed(false);
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <span>Tôi đồng ý với các điều khoản trên</span>
                  </label>
                </div>

                <button
                  className={styles.confirmButton}
                  onClick={handleConfirm}
                  disabled={!hasRead || !hasAgreed}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}