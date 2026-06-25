/** Default image shown when thumbnail is missing or fails to load. */
export const DEFAULT_FALLBACK_IMAGE = '/placeholder-image.svg';

/** Convert legacy raw.githubusercontent.com URLs to same-origin paths for GitHub Pages. */
export function resolveImageUrl(url: string): string {
  if (!url?.trim()) return url;

  if (url.startsWith('/') && !url.startsWith('//')) return url;

  const match = url.match(
    /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/public\/(.+)$/i
  );
  if (match) return `/${match[1]}`;

  return url;
}

/** Build absolute URL for Open Graph / Twitter meta tags. */
export function toAbsoluteImageUrl(
  url: string,
  origin = 'https://www.unifolio.io.vn'
): string {
  const resolved = resolveImageUrl(url);
  if (!resolved) return `${origin}/placeholder-image.svg`;
  if (resolved.startsWith('/')) return `${origin}${resolved}`;
  return resolved;
}

/** Public path for uploaded asset thumbnails (served from GitHub Pages). */
export function getAssetImagePath(filename: string): string {
  return `/assets/${filename}`;
}

/** Public path for uploaded article/project images. */
export function getUploadedImagePath(folder: 'articles' | 'projects', filename: string): string {
  return `/images/${folder}/${filename}`;
}
