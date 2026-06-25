import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { DEFAULT_FALLBACK_IMAGE, resolveImageUrl } from '../lib/imageUrl';

export default function ImageWithFallback({
  src,
  alt,
  height = 200,
  className,
  sx = {},
  priority = false,
}: {
  src?: string;
  alt: string;
  height?: number | string;
  className?: string;
  sx?: Record<string, unknown>;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveImageUrl(src || '');
  const showFallback = !resolvedSrc || failed;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (showFallback) {
    return (
      <Box
        className={className}
        sx={{
          height,
          width: '100%',
          display: 'block',
          overflow: 'hidden',
          ...sx,
        }}
      >
        <Box
          component="img"
          src={DEFAULT_FALLBACK_IMAGE}
          alt={alt}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      className={className}
      src={resolvedSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
      sx={{
        height,
        width: '100%',
        objectFit: 'cover',
        display: 'block',
        ...sx,
      }}
    />
  );
}
