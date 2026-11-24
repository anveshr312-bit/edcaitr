import crypto from 'node:crypto';

export function getImageKitUrl(ref?: string | null): string | null {
  if (!ref) return null;
  const trimmed = ref.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.replace(/\/+$/, '');
  if (!endpoint || endpoint.includes('your_imagekit_id')) return null;

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${endpoint}${normalizedPath}`;
}

export interface ImageKitSignature {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

/**
 * Server-only ImageKit upload signature generator.
 * Uses IMAGEKIT_PRIVATE_KEY (never exposed to browser).
 */
export function createImageKitUploadSignature(): ImageKitSignature | null {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (
    !privateKey ||
    !publicKey ||
    !urlEndpoint ||
    privateKey.includes('your-imagekit') ||
    publicKey.includes('your-imagekit') ||
    urlEndpoint.includes('your_imagekit_id')
  ) {
    return null;
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 60 * 15; // 15 minutes
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return { token, expire, signature, publicKey, urlEndpoint };
}
