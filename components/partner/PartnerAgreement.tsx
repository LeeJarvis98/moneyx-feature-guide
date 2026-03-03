'use client';

import { useState } from 'react';
import { Gem, Diamond, Star, Award, Medal, Shield, Mail, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import styles from './PartnerAgreement.module.css';

interface PartnerAgreementProps {
  onAccept: () => void;
  selectedPlatform: string | null;
  onPlatformSelect: (platform: string) => void;
  userId: string;
  isPartner?: boolean;
  onRegistrationSuccess: () => void;
  partnerStatus?: string;
  tokenExpiresAt?: string | null;
}

const partnerTiers = [
  { name: 'Kim Cương', partner: '90%', tradi: '10%', condition: '2000 Lot', icon: Gem },
  { name: 'Bạch Kim', partner: '85%', tradi: '15%', condition: '1000 Lot', icon: Diamond },
  { name: 'Vàng', partner: '80%', tradi: '20%', condition: '500 Lot', icon: Star },
  { name: 'Bạc', partner: '75%', tradi: '25%', condition: '100 Lot', icon: Award },
  { name: 'Đồng', partner: '70%', tradi: '30%', condition: 'Hoàn thành', icon: Medal },
];

export default function PartnerAgreement({ onAccept, selectedPlatform, onPlatformSelect, userId, isPartner = false, onRegistrationSuccess, partnerStatus, tokenExpiresAt }: PartnerAgreementProps) {
  const [hasRead, setHasRead] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasClickedTerms, setHasClickedTerms] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const isTokenExpired = tokenExpiresAt ? new Date(tokenExpiresAt) < new Date() : false;

  // No referrer check needed - single partner type system

  const canProceed = hasConfirmed;
  const canConfirm = hasRead && hasAgreed;

  const handleConfirm = () => {
    if (canConfirm) {
      setHasConfirmed(true);
      setShowTermsModal(false);
    }
  };

  const handleRegisterAsPartner = async () => {
    if (!canProceed || isRegistering) return;

    // Intercept: user already has a pending inactive partner record
    if (partnerStatus === 'inactive') {
      setResendSuccess(false);
      setResendError(null);
      setShowPendingModal(true);
      return;
    }

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register as partner');
      }

      // Store and dispatch referral ID if provided
      if (data.referralId) {
        // Store in both sessionStorage and localStorage for persistence
        sessionStorage.setItem('referralId', data.referralId);
        localStorage.setItem('referralId', data.referralId);
        // Dispatch custom event for referral ID update
        window.dispatchEvent(new CustomEvent('referralIdUpdated', {
          detail: { referralId: data.referralId }
        }));
      }

      // Registration requires email confirmation before partner access
      if (data.requiresEmailConfirmation) {
        setShowEmailModal(true);
        // Notify parent that the partner record now exists but is inactive
        onRegistrationSuccess();
        return;
      }

      // Fallback: immediate success (should not happen with new flow)
      onRegistrationSuccess();
    } catch (error) {
      console.error('[PartnerAgreement] Registration error:', error);

      // Check if error is due to timeout
      if (error instanceof Error && error.name === 'AbortError') {
        setRegistrationError('Đăng ký quá lâu. Vui lòng thử lại hoặc kiểm tra kết nối mạng.');
      } else {
        setRegistrationError(error instanceof Error ? error.message : 'Failed to register');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResendEmail = async () => {
    if (isResending) return;
    setIsResending(true);
    setResendError(null);
    try {
      const res = await fetch('/api/resend-agreement-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gửi email thất bại');
      setResendSuccess(true);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Video Background */}
      <video
        className={styles.backgroundVideo}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/vnclc-partner-background.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className={styles.overlay} />

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.mainContent}>
          <h1 className={styles.title}>HOA HỒNG ĐỐI TÁC</h1>

          <p className={styles.description}>
            Đối tác được hưởng hoa hồng theo 5 cấp độ và chia sẻ phí dịch vụ Tradi khi giới thiệu thành công Bot VNCLC cho user mới.
          </p>

          <div className={styles.horizontalLayout}>
            <div className={styles.leftSection}>
              <div className={styles.tableContainer}>
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
                          <IconComponent size={18} className={styles.checkmark} />
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

              {/* Buttons */}
              {!isPartner && (
                <div className={styles.buttonContainer}>
                  {registrationError && (
                    <div className={styles.errorMessage}>
                      {registrationError}
                    </div>
                  )}
                  <div className={styles.buttonGrid}>
                    <button
                      className={`${styles.termsButton} ${styles.termsButtonFilled} ${!hasClickedTerms ? styles.breathing : ''}`}
                      onClick={() => {
                        setShowTermsModal(true);
                        setHasClickedTerms(true);
                      }}
                    >
                      Điều khoản hợp tác & bảo mật
                    </button>
                    <button
                      className={styles.partnerButton}
                      onClick={handleRegisterAsPartner}
                      disabled={!canProceed || isRegistering}
                    >
                      {isRegistering ? 'Đang đăng ký...' : 'ĐĂNG KÝ ĐẠI LÝ TRADI'}
                    </button>
                  </div>
                </div>
              )}
              {isPartner && (
                <div className={styles.buttonContainer}>
                  <button
                    className={`${styles.termsButton} ${styles.termsButtonFilled}`}
                    onClick={() => setShowTermsModal(true)}
                  >
                    Xem điều khoản hợp tác & bảo mật
                  </button>
                </div>
              )}

              {/* Inactive partner notice */}
              {isPartner && partnerStatus === 'inactive' && (
                <div className={styles.inactiveNotice}>
                  <Mail size={20} className={styles.inactiveNoticeIcon} />
                  <div>
                    <p className={styles.inactiveNoticeTitle}>Tài khoản chờ xác nhận</p>
                    <p className={styles.inactiveNoticeText}>
                      Vui lòng kiểm tra email và nhấn nút &ldquo;Tôi đã đọc và xác nhận&rdquo; trong thư hợp đồng để kích hoạt tài khoản đối tác.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
              {/* Modal Header */}
              <div className={styles.termsHeader}>
                <h3 className={styles.termsTitle}>HỢP ĐỒNG ĐỐI TÁC TRADI</h3>
                <p className={styles.termsSubtitle}>Vui lòng đọc kỹ trước khi xác nhận tham gia</p>
              </div>

              <div className={styles.termsContent}>

                {/* Section I */}
                <div className={styles.termsBlock}>
                  <h4 className={styles.termsSectionTitle}>I. CÁC BÊN KÝ KẾT</h4>
                  <div className={styles.termsHighlightBox}>
                    <p className={styles.termsHighlightItem}>
                      <strong className={styles.termsStrong}>BÊN A (CÔNG TY TRADI):</strong> Công ty cung cấp nền tảng Bot giao dịch VNCLC và hệ thống quản lý đối tác.
                    </p>
                    <p className={`${styles.termsHighlightItem} ${styles.termsHighlightItemLast}`}>
                      <strong className={styles.termsStrong}>BÊN B (ĐỐI TÁC):</strong> Cá nhân hoặc tổ chức đăng ký tham gia chương trình đại lý nhằm mục đích giới thiệu dịch vụ và nhận hoa hồng.
                    </p>
                  </div>
                </div>

                {/* Section II */}
                <div className={styles.termsBlock}>
                  <h4 className={styles.termsSectionTitle}>II. NGHĨA VỤ VÀ QUY ĐỊNH ĐỐI TÁC</h4>
                  <ol className={styles.termsList}>
                    <li>Mọi thông tin liên quan đến khách hàng và tài khoản giao dịch phải được <strong className={styles.termsStrong}>bảo mật tuyệt đối</strong>. Không được tiết lộ cho bên thứ ba dưới bất kỳ hình thức nào.</li>
                    <li>Mọi hành vi vi phạm bảo mật gây thiệt hại cho Tradi hoặc khách hàng sẽ phải <strong className={styles.termsStrong}>hoàn toàn chịu trách nhiệm pháp lý</strong> theo quy định của pháp luật hiện hành.</li>
                    <li>Bot VNCLC là sản phẩm <strong className={styles.termsStrong}>miễn phí</strong>. Đối tác chỉ được phép chia sẻ Link Referral của cộng đồng. <strong className={styles.termsDanger}>Nghiêm cấm mua bán</strong> Bot hoặc tài khoản dưới mọi hình thức.</li>
                    <li>Đối tác phải đạt cấp <strong className={styles.termsStrong}>Bạc trở lên</strong> mới có thể sử dụng tính năng Partner System tìm kiếm nhanh trên hệ thống.</li>
                    <li>Đối tác có trách nhiệm cung cấp <strong className={styles.termsStrong}>Link Referral sàn giao dịch</strong> và thông tin liên hệ hợp lệ để Tradi thiết lập hệ thống hoa hồng trên website.</li>
                    <li>Cấp bậc đối tác được xác định dựa trên <strong className={styles.termsStrong}>vị trí trong chuỗi giới thiệu</strong> và <strong className={styles.termsStrong}>tổng khối lượng giao dịch</strong> tích lũy của toàn bộ mạng lưới.</li>
                    <li>Đối tác cam kết không thực hiện các hành vi gian lận, tạo tài khoản ảo hoặc bất kỳ hành vi nào nhằm trục lợi bất hợp pháp từ hệ thống hoa hồng.</li>
                  </ol>
                </div>

                {/* Section III */}
                <div className={styles.termsBlock}>
                  <h4 className={styles.termsSectionTitle}>III. HỆ THỐNG HOA HỒNG</h4>
                  <ol className={styles.termsList}>
                    <li>Đối tác bắt đầu từ cấp độ <strong className={styles.termsGold}>Đồng (70%)</strong> và chia sẻ phần hoa hồng còn lại theo cấu trúc upline.</li>
                    <li>Hoa hồng được tính toán và <strong className={styles.termsStrong}>chi trả vào ngày 1 hàng tháng</strong> cho kỳ giao dịch của tháng trước.</li>
                    <li>Công thức phân chia: <strong className={styles.termsStrong}>5%</strong> cho Tradi · <strong className={styles.termsStrong}>50%</strong> cho người giới thiệu trực tiếp · <strong className={styles.termsStrong}>50%</strong> còn lại chia đều cho upline gián tiếp trong chuỗi.</li>
                    <li>Cấp bậc đối tác tăng dần dựa vào tổng khối lượng giao dịch tích lũy của toàn mạng lưới bên dưới.</li>
                  </ol>

                  {/* Rank table */}
                  <div className={styles.termsRankTable}>
                    <div className={styles.termsRankHeader}>
                      <span>Cấp Độ</span>
                      <span>Đối Tác</span>
                      <span>Tradi</span>
                      <span>Điều Kiện</span>
                    </div>
                    <div className={styles.termsRankRow}>
                      <span className={styles.rankDiamond}>💎 Kim Cương</span>
                      <span>90%</span><span className={styles.rankTradi}>10%</span><span>2.000 Lot</span>
                    </div>
                    <div className={`${styles.termsRankRow} ${styles.termsRankRowAlt}`}>
                      <span className={styles.rankPlatinum}>⭐ Bạch Kim</span>
                      <span>85%</span><span className={styles.rankTradi}>15%</span><span>1.000 Lot</span>
                    </div>
                    <div className={styles.termsRankRow}>
                      <span className={styles.rankGold}>🏆 Vàng</span>
                      <span>80%</span><span className={styles.rankTradi}>20%</span><span>500 Lot</span>
                    </div>
                    <div className={`${styles.termsRankRow} ${styles.termsRankRowAlt}`}>
                      <span className={styles.rankSilver}>🥈 Bạc</span>
                      <span>75%</span><span className={styles.rankTradi}>25%</span><span>100 Lot</span>
                    </div>
                    <div className={styles.termsRankRow}>
                      <span className={styles.rankBronze}>🔰 Đồng</span>
                      <span>70%</span><span className={styles.rankTradi}>30%</span><span>Hoàn thành đăng ký</span>
                    </div>
                  </div>
                </div>

                {/* Section IV */}
                <div className={styles.termsBlock}>
                  <h4 className={styles.termsSectionTitle}>IV. ĐIỀU KHOẢN CHẤM DỨT HỢP ĐỒNG</h4>
                  <ol className={styles.termsList}>
                    <li>Hợp đồng có thể bị chấm dứt nếu đối tác vi phạm bất kỳ điều khoản nào được quy định trong tài liệu này.</li>
                    <li>Tradi có quyền thu hồi quyền truy cập hệ thống và dừng chi trả hoa hồng ngay lập tức khi phát hiện vi phạm.</li>
                    <li>Đối tác có thể tự chấm dứt hợp đồng bằng cách thông báo bằng văn bản cho Tradi trước <strong className={styles.termsStrong}>30 ngày</strong>.</li>
                    <li>Sau khi chấm dứt hợp đồng, hoa hồng tích lũy hợp lệ vẫn được chi trả theo lịch thông thường.</li>
                  </ol>
                </div>

                {/* Section V */}
                <div className={styles.termsBlock}>
                  <h4 className={styles.termsSectionTitle}>V. ĐIỀU KHOẢN CHUNG</h4>
                  <ol className={styles.termsList}>
                    <li>Hợp đồng này có hiệu lực kể từ khi đối tác xác nhận đồng ý bằng cách nhấn nút bên dưới.</li>
                    <li>Tradi có quyền cập nhật các điều khoản và sẽ thông báo đến đối tác qua email đăng ký ít nhất <strong className={styles.termsStrong}>7 ngày</strong> trước khi có hiệu lực.</li>
                    <li>Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng; nếu không đạt được, sẽ theo quy định pháp luật Việt Nam.</li>
                  </ol>
                </div>

              </div>

              {/* Checkboxes - only shown for non-partners */}
              {!isPartner && (
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
                    disabled={!canConfirm}
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Confirmation Modal */}
      {showPendingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowPendingModal(false)}>&#x2715;</button>
            <div className={styles.pendingModalBody}>
              <div className={`${styles.pendingModalIcon} ${isTokenExpired ? styles.pendingModalIconExpired : ''}`}>
                {isTokenExpired ? <Clock size={36} /> : <Mail size={36} />}
              </div>

              {!isTokenExpired ? (
                <>
                  <h2 className={styles.pendingModalTitle}>Xác nhận email của bạn</h2>
                  <p className={styles.pendingModalSubtitle}>
                    Bạn đã đăng ký đại lý trước đó. Vui lòng kiểm tra hộp thư và nhấn nút
                    <strong> &ldquo;Tôi đã đọc và xác nhận&rdquo; </strong>
                    trong email Hợp Đồng Đối Tác Tradi để kích hoạt tài khoản.
                  </p>
                  <div className={styles.pendingSteps}>
                    <div className={styles.pendingStep}>
                      <span className={styles.pendingStepNum}>1</span>
                      <span>Mở email từ VNCLC trong hộp thư của bạn</span>
                    </div>
                    <div className={styles.pendingStep}>
                      <span className={styles.pendingStepNum}>2</span>
                      <span>Nhấn nút <strong>&ldquo;Tôi đã đọc và xác nhận&rdquo;</strong> trong email</span>
                    </div>
                    <div className={styles.pendingStep}>
                      <span className={styles.pendingStepNum}>3</span>
                      <span>Quay lại đây và tải lại trang</span>
                    </div>
                  </div>
                  <div className={styles.pendingHint}>
                    <Clock size={14} />
                    <span>Liên kết xác nhận hết hạn sau <strong>72 giờ</strong> kể từ khi nhận được email.</span>
                  </div>
                </>
              ) : (
                <>
                  <h2 className={styles.pendingModalTitle}>Liên kết đã hết hạn</h2>
                  <p className={styles.pendingModalSubtitle}>
                    Liên kết xác nhận hợp đồng của bạn đã quá 72 giờ.
                    Nhấn nút bên dưới để nhận lại email xác nhận mới.
                  </p>
                  {!resendSuccess ? (
                    <>
                      {resendError && (
                        <div className={styles.pendingResendError}>{resendError}</div>
                      )}
                      <button
                        className={styles.pendingResendButton}
                        onClick={handleResendEmail}
                        disabled={isResending}
                      >
                        <RefreshCw size={16} className={isResending ? styles.spinning : ''} />
                        {isResending ? 'Đang gửi...' : 'Gửi lại email xác nhận'}
                      </button>
                    </>
                  ) : (
                    <div className={styles.pendingResendSuccess}>
                      <CheckCircle size={20} />
                      <span>Email đã được gửi! Vui lòng kiểm tra hộp thư và nhấn xác nhận trong vòng 72 giờ.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showEmailModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowEmailModal(false)}>&#x2715;</button>
            <div className={styles.emailModalBody}>
              <div className={styles.emailModalIcon}>
                <Mail size={40} />
              </div>
              <h2 className={styles.emailModalTitle}>Kiểm tra email của bạn!</h2>
              <p className={styles.emailModalSubtitle}>
                Đăng ký đại lý thành công. Chúng tôi đã gửi <strong>Hợp Đồng Đối Tác Tradi</strong> đến email của bạn.
              </p>
              <div className={styles.emailModalSteps}>
                <div className={styles.emailModalStep}>
                  <span className={styles.emailModalStepNum}>1</span>
                  <span>Mở email từ VNCLC trong hộp thư của bạn</span>
                </div>
                <div className={styles.emailModalStep}>
                  <span className={styles.emailModalStepNum}>2</span>
                  <span>Đọc kỹ Hợp Đồng Đối Tác Tradi</span>
                </div>
                <div className={styles.emailModalStep}>
                  <span className={styles.emailModalStepNum}>3</span>
                  <span>Nhấn nút <strong>&ldquo;Tôi đã đọc và xác nhận&rdquo;</strong> trong email</span>
                </div>
                <div className={styles.emailModalStep}>
                  <span className={styles.emailModalStepNum}>4</span>
                  <span>Quay lại đây và đăng nhập vào giao diện Đối Tác</span>
                </div>
              </div>
              <div className={styles.emailModalWarning}>
                <CheckCircle size={16} />
                <span>Tài khoản sẽ chỉ được kích hoạt sau khi bạn xác nhận trong email.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}