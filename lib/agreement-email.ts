/**
 * Shared agreement email HTML builder used by the resend-agreement-email route.
 */
export function buildAgreementEmailHtml(confirmUrl: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 40px; border-radius: 16px;">

    <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid rgba(255,184,28,0.3); padding-bottom: 24px;">
      <h1 style="color: #FFB81C; font-size: 26px; margin: 0 0 6px;">HỢP ĐỒNG ĐỐI TÁC TRADI</h1>
      <p style="color: #888; font-size: 13px; margin: 0;">Liên kết xác nhận mới — vui lòng nhấn bên dưới để kích hoạt tài khoản</p>
    </div>

    <p style="font-size: 15px; line-height: 1.7; color: #ccc;">Chào bạn,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #ccc;">
      Đây là liên kết xác nhận <strong style="color: #FFB81C;">Hợp Đồng Đối Tác Tradi</strong> mới của bạn.
      Vui lòng nhấn nút bên dưới để kích hoạt tài khoản đối tác.
    </p>

    <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;"></div>

    <div style="text-align: center; margin: 36px 0 24px;">
      <p style="color: #ccc; font-size: 14px; margin-bottom: 20px;">
        Bằng cách nhấn nút bên dưới, bạn xác nhận đã đọc, hiểu và đồng ý với toàn bộ các điều khoản trong Hợp Đồng Đối Tác Tradi.
      </p>
      <a href="${confirmUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #FFB81C 0%, #f59e0b 100%); color: #000; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 20px rgba(255,184,28,0.4);">
        Tôi đã đọc và xác nhận
      </a>
      <p style="color: #666; font-size: 12px; margin-top: 16px;">
        Liên kết này có hiệu lực trong vòng <strong style="color: #888;">72 giờ</strong> kể từ khi nhận được email.
      </p>
    </div>

    <div style="background: rgba(220, 38, 38, 0.08); border-left: 4px solid #dc2626; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
      <p style="margin: 0; color: #ff6b6b; font-size: 13px;">
        ⚠️ Tài khoản đối tác của bạn sẽ <strong>không được kích hoạt</strong> cho đến khi bạn xác nhận đồng ý với các điều khoản trên.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 0 0 20px;" />

    <p style="color: #555; font-size: 12px; text-align: center; margin: 0;">
      Email này được gửi tự động từ hệ thống VNCLC / Tradi. Vui lòng không trả lời email này.<br/>
      Nếu bạn không thực hiện đăng ký đối tác, hãy bỏ qua email này.
    </p>
  </div>
  `;
}

