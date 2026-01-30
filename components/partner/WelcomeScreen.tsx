'use client';

import { Crown } from 'lucide-react';
import styles from './WelcomeScreen.module.css';

export default function WelcomeScreen() {
   return (
      <div className={styles.welcomeScreen}>
         <div className={styles.welcomeContent}>
            <div className={styles.welcomeIcon}>
               <Crown size={80} strokeWidth={1.5} />
            </div>
            <h2>Chào mừng đến Cổng Đối Tác</h2>
            <p className={styles.welcomeDescription}>
               Để bắt đầu, vui lòng chọn sàn bạn đang sử dụng và đăng nhập bằng thông tin Đối Tác sàn đó của bạn.
            </p>
            <div className={styles.welcomeSteps}>
               <div className={styles.step}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepText}>
                     <strong>Nhấn nút "Thêm sàn" ở bên trái</strong>
                  </div>
               </div>
               <div className={styles.step}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepText}>
                     <strong>Chọn các sàn bạn muốn sử dụng</strong>
                  </div>
               </div>
               <div className={styles.step}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepText}>
                     <strong>Lưu và đăng nhập vào sàn để bắt đầu</strong>
                  </div>
               </div>
            </div>
            <div className={styles.welcomeHint}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
               </svg>
               <span>Bạn có thể chọn nhiều sàn và chuyển đổi giữa chúng bất cứ lúc nào</span>
            </div>
         </div>
      </div>
   );
}
