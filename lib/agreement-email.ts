/**
 * Shared agreement email HTML builder.
 * Used by both register-partner and resend-agreement-email routes.
 */
export function buildAgreementEmailHtml(confirmUrl: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 40px; border-radius: 16px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid rgba(255,184,28,0.3); padding-bottom: 24px;">
      <h1 style="color: #FFB81C; font-size: 26px; margin: 0 0 6px;">HỢP ĐỒNG ĐỐI TÁC TRADI</h1>
      <p style="color: #888; font-size: 13px; margin: 0;">Vui lòng đọc kỹ trước khi xác nhận tham gia</p>
    </div>

    <!-- Greeting -->
    <p style="font-size: 15px; line-height: 1.7; color: #ccc;">Chào bạn,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #ccc;">
      Cảm ơn bạn đã đăng ký tham gia chương trình <strong style="color: #FFB81C;">Đại Lý Tradi</strong>.
      Dưới đây là toàn bộ điều khoản và quy định của Hợp Đồng Đối Tác mà bạn cần đọc và đồng ý trước khi tài khoản được kích hoạt.
    </p>

    <!-- Divider -->
    <div style="border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;"></div>

    <!-- Section 1: Bên Ký Kết -->
    <div style="margin-bottom: 24px;">
      <h2 style="color: #FFB81C; font-size: 16px; text-transform: uppercase; margin: 0 0 12px; letter-spacing: 1px;">I. CÁC BÊN KÝ KẾT</h2>
      <div style="background: rgba(255,184,28,0.05); border-left: 3px solid #FFB81C; padding: 14px 16px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 8px; color: #ccc; font-size: 14px;"><strong style="color: #fff;">BÊN A (CÔNG TY TRADI):</strong> Công ty cung cấp nền tảng Bot giao dịch VNCLC và hệ thống quản lý đối tác.</p>
        <p style="margin: 0; color: #ccc; font-size: 14px;"><strong style="color: #fff;">BÊN B (ĐỐI TÁC):</strong> Cá nhân hoặc tổ chức đăng ký tham gia chương trình đại lý nhằm mục đích giới thiệu dịch vụ và nhận hoa hồng.</p>
      </div>
    </div>

    <!-- Section 2: Nghĩa Vụ Đối Tác -->
    <div style="margin-bottom: 24px;">
      <h2 style="color: #FFB81C; font-size: 16px; text-transform: uppercase; margin: 0 0 12px; letter-spacing: 1px;">II. NGHĨA VỤ VÀ QUY ĐỊNH ĐỐI TÁC</h2>
      <ol style="margin: 0; padding-left: 20px; color: #ccc; line-height: 2; font-size: 14px;">
        <li>Mọi thông tin liên quan đến khách hàng và tài khoản giao dịch phải được <strong style="color: #fff;">bảo mật tuyệt đối</strong>. Không được tiết lộ cho bên thứ ba dưới bất kỳ hình thức nào.</li>
        <li>Mọi hành vi vi phạm bảo mật gây thiệt hại cho Tradi hoặc khách hàng sẽ phải <strong style="color: #fff;">hoàn toàn chịu trách nhiệm pháp lý</strong> theo quy định của pháp luật hiện hành.</li>
        <li>Bot VNCLC là sản phẩm <strong style="color: #fff;">miễn phí</strong>. Đối tác chỉ được phép chia sẻ Link Referral của cộng đồng. <strong style="color: #ff6b6b;">Nghiêm cấm mua bán</strong> Bot hoặc tài khoản dưới mọi hình thức.</li>
        <li>Đối tác phải đạt cấp <strong style="color: #fff;">Bạc trở lên</strong> mới có thể sử dụng tính năng Partner System tìm kiếm nhanh trên hệ thống.</li>
        <li>Đối tác có trách nhiệm cung cấp <strong style="color: #fff;">Link Referral sàn giao dịch</strong> và thông tin liên hệ hợp lệ để Tradi thiết lập hệ thống hoa hồng trên website.</li>
        <li>Cấp bậc đối tác được xác định dựa trên <strong style="color: #fff;">vị trí trong chuỗi giới thiệu</strong> và <strong style="color: #fff;">tổng khối lượng giao dịch</strong> tích lũy của toàn bộ mạng lưới.</li>
        <li>Đối tác cam kết không thực hiện các hành vi gian lận, tạo tài khoản ảo hoặc bất kỳ hành vi nào nhằm trục lợi bất hợp pháp từ hệ thống hoa hồng.</li>
      </ol>
    </div>

    <!-- Section 3: Hệ Thống Hoa Hồng -->
    <div style="margin-bottom: 24px;">
      <h2 style="color: #FFB81C; font-size: 16px; text-transform: uppercase; margin: 0 0 12px; letter-spacing: 1px;">III. HỆ THỐNG HOA HỒNG</h2>
      <ol style="margin: 0; padding-left: 20px; color: #ccc; line-height: 2; font-size: 14px;">
        <li>Đối tác bắt đầu từ cấp độ <strong style="color: #FFB81C;">Đồng (70%)</strong> và chia sẻ phần hoa hồng còn lại theo cấu trúc upline.</li>
        <li>Hoa hồng được tính toán và <strong style="color: #fff;">chi trả vào ngày 1 hàng tháng</strong> cho kỳ giao dịch của tháng trước.</li>
        <li>Công thức phân chia: <strong style="color: #fff;">5%</strong> cho Tradi · <strong style="color: #fff;">50%</strong> cho người giới thiệu trực tiếp · <strong style="color: #fff;">50%</strong> còn lại chia đều cho upline gián tiếp trong chuỗi.</li>
        <li>Cấp bậc đối tác tăng dần dựa vào tổng khối lượng giao dịch tích lũy của toàn mạng lưới bên dưới.</li>
      </ol>
    </div>

    <!-- Section 4: Điều Khoản Chấm Dứt -->
    <div style="margin-bottom: 24px;">
      <h2 style="color: #FFB81C; font-size: 16px; text-transform: uppercase; margin: 0 0 12px; letter-spacing: 1px;">IV. ĐIỀU KHOẢN CHẤM DỨT HỢP ĐỒNG</h2>
      <ol style="margin: 0; padding-left: 20px; color: #ccc; line-height: 2; font-size: 14px;">
        <li>Hợp đồng có thể bị chấm dứt nếu đối tác vi phạm bất kỳ điều khoản nào được quy định trong tài liệu này.</li>
        <li>Tradi có quyền thu hồi quyền truy cập hệ thống và dừng chi trả hoa hồng ngay lập tức khi phát hiện vi phạm.</li>
        <li>Đối tác có thể tự chấm dứt hợp đồng bằng cách thông báo bằng văn bản cho Tradi trước <strong style="color: #fff;">30 ngày</strong>.</li>
        <li>Sau khi chấm dứt hợp đồng, hoa hồng tích lũy hợp lệ vẫn được chi trả theo lịch thông thường.</li>
      </ol>
    </div>

    <!-- Section 5: Điều Khoản Chung -->
    <div style="margin-bottom: 28px;">
      <h2 style="color: #FFB81C; font-size: 16px; text-transform: uppercase; margin: 0 0 12px; letter-spacing: 1px;">V. ĐIỀU KHOẢN CHUNG</h2>
      <ol style="margin: 0; padding-left: 20px; color: #ccc; line-height: 2; font-size: 14px;">
        <li>Hợp đồng này có hiệu lực kể từ khi đối tác xác nhận đồng ý bằng cách nhấn nút bên dưới.</li>
        <li>Tradi có quyền cập nhật các điều khoản và sẽ thông báo đến đối tác qua email đăng ký ít nhất <strong style="color: #fff;">7 ngày</strong> trước khi có hiệu lực.</li>
        <li>Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng; nếu không đạt được, sẽ theo quy định pháp luật Việt Nam.</li>
      </ol>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 36px 0 24px;">
      <p style="color: #ccc; font-size: 14px; margin-bottom: 20px;">
        Bằng cách nhấn nút bên dưới, bạn xác nhận đã đọc, hiểu và đồng ý với toàn bộ các điều khoản trong Hợp Đồng Đối Tác Tradi.
      </p>
      <a href="${confirmUrl}"
         style="display: inline-block; background: #FFB81C; color: #000; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 20px rgba(255,184,28,0.4);">
        Tôi đã đọc và xác nhận
      </a>
      <p style="color: #666; font-size: 12px; margin-top: 16px;">
        Liên kết này có hiệu lực trong vòng <strong style="color: #888;">72 giờ</strong> kể từ khi nhận được email.
      </p>
    </div>

    <!-- Warning -->
    <div style="background: rgba(220, 38, 38, 0.08); border-left: 4px solid #dc2626; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
      <p style="margin: 0; color: #ff6b6b; font-size: 13px;">
        ⚠️ Tài khoản đối tác của bạn sẽ <strong>không được kích hoạt</strong> cho đến khi bạn xác nhận đồng ý với các điều khoản trên. Bạn sẽ không thể truy cập giao diện Đối Tác nếu chưa hoàn thành bước này.
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

