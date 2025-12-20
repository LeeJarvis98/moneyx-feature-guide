'use client';

import { useParams } from 'next/navigation';
import { useRouter, usePathname } from '@/routing';
import { Select } from '@mantine/core';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = params.locale as string;

  const handleLanguageChange = (value: string | null) => {
    if (!value) return;
    
    router.replace(pathname, { locale: value });
  };

  return (
    <Select
      value={locale}
      onChange={handleLanguageChange}
      data={[
        { value: 'en', label: 'English' },
        { value: 'vi', label: 'Tiếng Việt' },
      ]}
      leftSection={<Languages size={16} />}
      styles={{
        input: { 
          width: 150,
          backgroundColor: '#2a2a2a', 
          borderColor: '#444',
          color: 'white'
        },
      }}
      size='sm'
    />
  );
}