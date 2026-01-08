'use client';

import { useParams } from 'next/navigation';
import { useRouter, usePathname } from '@/routing';
import { SegmentedControl, Center } from '@mantine/core';

export function LanguageSwitcher() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = params.locale as string;

  const handleLanguageChange = (value: string) => {
    router.replace(pathname, { locale: value });
  };

  return (
    <SegmentedControl
      value={locale}
      onChange={handleLanguageChange}
      data={[
        {
          value: 'en',
          label: 'EN',
        },
        {
          value: 'vi',
          label: 'VI',
        },
      ]}
      size="sm"
      transitionDuration={500}
      transitionTimingFunction="linear"
    />
  );
}