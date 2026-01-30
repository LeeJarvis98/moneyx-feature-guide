'use client';

import { useState } from 'react';
import { Paper, Radio, Group, Button, Text, Alert } from '@mantine/core';
import styles from './ChangeForm.module.css';

interface ChangeFormProps {
  autoFetch?: boolean;
}

export default function ChangeForm({ autoFetch = false }: ChangeFormProps) {
  const [currentForm, setCurrentForm] = useState<string>('individual');
  const [selectedForm, setSelectedForm] = useState<string>('individual');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (selectedForm === currentForm) return;
    
    setLoading(true);
    setSuccess(false);
    
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentForm(selectedForm);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error changing form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Paper className={styles.paper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Đổi hình thức</h2>
        </div>

        <div className={styles.content}>
          <Alert className={styles.alert} color="blue" title="Hình thức hiện tại">
            Bạn đang sử dụng hình thức: <strong>
              {currentForm === 'individual' ? 'Cá nhân' : 'Doanh nghiệp'}
            </strong>
          </Alert>

          <div className={styles.formSection}>
            <Text size="sm" fw={500} mb="md">
              Chọn hình thức mới:
            </Text>
            
            <Radio.Group
              value={selectedForm}
              onChange={setSelectedForm}
            >
              <Group mt="xs" className={styles.radioGroup}>
                <Radio 
                  value="individual" 
                  label="Cá nhân"
                  description="Dành cho đối tác cá nhân"
                  className={styles.radio}
                />
                <Radio 
                  value="business" 
                  label="Doanh nghiệp"
                  description="Dành cho công ty, tổ chức"
                  className={styles.radio}
                />
              </Group>
            </Radio.Group>
          </div>

          {success && (
            <Alert className={styles.successAlert} color="green" title="Thành công">
              Đã đổi hình thức thành công!
            </Alert>
          )}

          <div className={styles.actions}>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={selectedForm === currentForm}
              color="yellow"
              size="md"
              fullWidth
            >
              Xác nhận đổi hình thức
            </Button>
          </div>

          <div className={styles.notice}>
            <Text size="xs" c="dimmed">
              <strong>Lưu ý:</strong> Việc đổi hình thức có thể ảnh hưởng đến các điều khoản hợp đồng và chính sách hoa hồng.
              Vui lòng liên hệ bộ phận hỗ trợ nếu cần tư vấn thêm.
            </Text>
          </div>
        </div>
      </Paper>
    </div>
  );
}