'use client';

import { useEffect, useState } from 'react';
import { Box, TypographyStylesProvider, Loader, Center, ActionIcon } from '@mantine/core';
import { Play } from 'lucide-react';
import Image from 'next/image';

interface ArticleViewerProps {
  selectedArticle: string;
}

// Map articles to their thumbnails
const articleThumbnails: Record<string, string> = {
  // Guides
  'guide-1': '/articles/thumbnails/guide-1.png',
  'guide-2': '/articles/thumbnails/guide-2.png',
  'guide-3': '/articles/thumbnails/guide-3.png',
  'guide-4': '/articles/thumbnails/guide-4.png',
  // Strategies
  'strategy-1': '/articles/thumbnails/strategy-1.png',
  'strategy-2': '/articles/thumbnails/strategy-2.png',
  'strategy-3': '/articles/thumbnails/strategy-3.png',
  'strategy-4': '/articles/thumbnails/strategy-4.png',
  'strategy-5': '/articles/thumbnails/strategy-5.png',
  'strategy-6': '/articles/thumbnails/strategy-6.png',
  'strategy-7': '/articles/thumbnails/strategy-7.png',
  'strategy-8': '/articles/thumbnails/strategy-8.png',
  'strategy-9': '/articles/thumbnails/strategy-9.png',
  'strategy-10': '/articles/thumbnails/strategy-10.png',
  'strategy-11': '/articles/thumbnails/strategy-11.png',
  'strategy-12': '/articles/thumbnails/strategy-12.png',
  'strategy-13': '/articles/thumbnails/strategy-13.png',
  'strategy-14': '/articles/thumbnails/strategy-14.png',
  'strategy-15': '/articles/thumbnails/strategy-15.png',
  'strategy-16': '/articles/thumbnails/strategy-16.png',
  'strategy-17': '/articles/thumbnails/strategy-17.png',
  'strategy-18': '/articles/thumbnails/strategy-18.png',
};

export function ArticleViewer({ selectedArticle }: ArticleViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Reset to thumbnail view when article changes
    setShowContent(false);
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

  const thumbnailPath = articleThumbnails[selectedArticle];

  // Show thumbnail if not clicked yet and thumbnail exists
  if (!showContent && thumbnailPath) {
    return (
      <Center style={{ width: '100%', minHeight: '400px', padding: '20px' }}>
        <Box
          style={{
            position: 'relative',
            maxWidth: '1200px',
            width: '100%',
            cursor: 'pointer',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
          onClick={() => setShowContent(true)}
        >
          <Image
            src={thumbnailPath}
            alt={`${selectedArticle} thumbnail`}
            width={800}
            height={450}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
          {/* Play button overlay */}
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              transition: 'all 0.3s ease',
            }}
          >
            <ActionIcon
              size={80}
              radius="xl"
              variant="filled"
              color="yellow"
              style={{
                backgroundColor: 'rgba(255, 184, 28, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(255, 184, 28, 0.4)',
              }}
            >
              <Play size={40} fill="currentColor" />
            </ActionIcon>
          </Box>
          {/* Hover overlay */}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              transition: 'opacity 0.3s ease',
              opacity: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0';
            }}
          />
        </Box>
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