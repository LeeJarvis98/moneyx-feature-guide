'use client';

import { useEffect, useState } from 'react';
import { Box, TypographyStylesProvider, Loader, Center } from '@mantine/core';

interface ArticleViewerProps {
  selectedArticle: string;
}

export function ArticleViewer({ selectedArticle }: ArticleViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch(`/articles/${selectedArticle}.html`)
      .then((response) => response.text())
      .then((html) => {
        // Extract body content from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyContent = doc.body.innerHTML;
        setHtmlContent(bodyContent);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading article:', error);
        setHtmlContent('<p>Error loading article content.</p>');
        setLoading(false);
      });
  }, [selectedArticle]);

  if (loading) {
    return (
      <Center style={{ height: '400px' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Box style={{ width: '100%' }}>
      <TypographyStylesProvider>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </TypographyStylesProvider>
    </Box>
  );
}