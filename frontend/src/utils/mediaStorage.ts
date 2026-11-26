'use client';

import { useEffect, useState } from 'react';
import { EventThumbnailMeta, UploadedFileRef } from '../types/portal';

/**
 * Browser-local IndexedDB media & document storage for Event Builder 2.0.
 *
 * Architectural note:
 * - Stores uploaded event thumbnails and participant file attachments (pitch decks,
 *   research documents) as binary Blobs in browser IndexedDB rather than storing
 *   oversized base64 strings inside localStorage or ephemeral blob: URLs.
 * - Assets are referenced via stable `idb://<assetId>` identifiers persisted in state.
 * - This is browser-local prototype persistence (scoped to this browser origin) and
 *   is explicitly framed as such in the UI — not remote cloud object storage.
 */

const DB_NAME = 'edc_aitr_media_store_v1';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
export const IDB_REF_PREFIX = 'idb://';

export const ALLOWED_THUMBNAIL_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

interface StoredAssetRecord {
  id: string;
  blob: Blob;
  name: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

const resolvedUrlCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string | null>>();

export function isIndexedDbMediaRef(value?: string | null): value is string {
  return Boolean(value && value.startsWith(IDB_REF_PREFIX));
}

export function extractAssetId(ref: string): string {
  return ref.slice(IDB_REF_PREFIX.length);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable in this browser environment.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open browser media database.'));
  });
}

async function putAssetRecord(record: StoredAssetRecord): Promise<void> {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to write media asset to browser storage.'));
  });
}

async function getAssetRecord(id: string): Promise<StoredAssetRecord | null> {
  const db = await openMediaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve((req.result as StoredAssetRecord | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error('Failed to read media asset from browser storage.'));
  });
}

export async function deleteStoredMedia(ref?: string | null): Promise<void> {
  if (!isIndexedDbMediaRef(ref)) return;
  const id = extractAssetId(ref);
  const cached = resolvedUrlCache.get(ref);
  if (cached) {
    URL.revokeObjectURL(cached);
    resolvedUrlCache.delete(ref);
  }
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore deletion error if DB is unavailable
  }
}

function decodeImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      if (!width || !height) {
        reject(new Error('Image appears to be empty or corrupted.'));
        return;
      }
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to decode image file. Please select a valid JPEG, PNG, or WebP image.'));
    };
    img.src = objectUrl;
  });
}

export async function validateAndStoreEventThumbnail(
  file: File
): Promise<{
  assetRef: string;
  previewUrl: string;
  meta: EventThumbnailMeta;
}> {
  if (!ALLOWED_THUMBNAIL_MIME_TYPES.has(file.type)) {
    throw new Error('Unsupported format. Please upload a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_THUMBNAIL_SIZE_BYTES) {
    throw new Error(`Image exceeds the 5 MB limit (${formatBytes(file.size)} selected).`);
  }
  if (file.size === 0) {
    throw new Error('Selected file is empty.');
  }

  const { width, height } = await decodeImageDimensions(file);
  if (width < 320 || height < 180) {
    throw new Error(
      `Image resolution (${width}×${height}px) is too small. Please upload an image at least 320×180px (1600×900px recommended).`
    );
  }

  const id = `thumb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const assetRef = `${IDB_REF_PREFIX}${id}`;

  await putAssetRecord({
    id,
    blob: file,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    width,
    height,
    createdAt: new Date().toISOString(),
  });

  const previewUrl = URL.createObjectURL(file);
  resolvedUrlCache.set(assetRef, previewUrl);

  return {
    assetRef,
    previewUrl,
    meta: {
      name: file.name,
      mimeType: file.type,
      width,
      height,
      size: file.size,
      storageMode: 'browser_indexeddb',
    },
  };
}

export async function validateAndStoreAvatarImage(
  file: File
): Promise<{
  assetRef: string;
  previewUrl: string;
  meta: {
    name: string;
    mimeType: string;
    width: number;
    height: number;
    size: number;
    storageMode: 'browser_indexeddb';
  };
}> {
  if (!ALLOWED_THUMBNAIL_MIME_TYPES.has(file.type)) {
    throw new Error('Unsupported format. Please upload a JPEG, PNG, or WebP portrait.');
  }
  if (file.size > MAX_THUMBNAIL_SIZE_BYTES) {
    throw new Error(`Portrait exceeds the 5 MB limit (${formatBytes(file.size)} selected).`);
  }
  if (file.size === 0) {
    throw new Error('Selected file is empty.');
  }

  const { width, height } = await decodeImageDimensions(file);
  if (width < 160 || height < 160) {
    throw new Error(
      `Image resolution (${width}×${height}px) is too small. Please upload a portrait at least 160×160px (square 512×512px recommended).`
    );
  }

  const id = `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const assetRef = `${IDB_REF_PREFIX}${id}`;

  await putAssetRecord({
    id,
    blob: file,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    width,
    height,
    createdAt: new Date().toISOString(),
  });

  const previewUrl = URL.createObjectURL(file);
  resolvedUrlCache.set(assetRef, previewUrl);

  return {
    assetRef,
    previewUrl,
    meta: {
      name: file.name,
      mimeType: file.type,
      width,
      height,
      size: file.size,
      storageMode: 'browser_indexeddb',
    },
  };
}

export async function validateAndStoreRegistrationDocument(
  file: File,
  allowedExtensionsHint?: string
): Promise<UploadedFileRef> {
  if (file.size === 0) {
    throw new Error('Selected file is empty.');
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(`File exceeds the 10 MB limit (${formatBytes(file.size)} selected).`);
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExt = /\.(pdf|doc|docx|ppt|pptx|jpg|jpeg|png|webp)$/.test(lowerName);
  const hasAllowedMime = file.type ? ALLOWED_DOCUMENT_MIME_TYPES.has(file.type) : false;

  if (!hasAllowedMime && !hasAllowedExt) {
    throw new Error(
      allowedExtensionsHint
        ? `Unsupported file format. Accepted formats: ${allowedExtensionsHint}`
        : 'Unsupported file format. Upload PDF, PPT/PPTX, DOC/DOCX, or JPEG/PNG/WebP.'
    );
  }

  const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const assetRef = `${IDB_REF_PREFIX}${id}`;
  const uploadedAt = new Date().toISOString();

  await putAssetRecord({
    id,
    blob: file,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    createdAt: uploadedAt,
  });

  return {
    assetRef,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    uploadedAt,
    storageMode: 'browser_indexeddb',
  };
}

export async function resolveMediaUrl(ref?: string | null): Promise<string | null> {
  if (!ref) return null;
  if (!isIndexedDbMediaRef(ref)) return ref;

  const cached = resolvedUrlCache.get(ref);
  if (cached) return cached;

  const pending = inFlightRequests.get(ref);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const record = await getAssetRecord(extractAssetId(ref));
      if (!record?.blob) return null;
      const objectUrl = URL.createObjectURL(record.blob);
      resolvedUrlCache.set(ref, objectUrl);
      return objectUrl;
    } catch {
      return null;
    } finally {
      inFlightRequests.delete(ref);
    }
  })();

  inFlightRequests.set(ref, promise);
  return promise;
}

export async function downloadStoredDocument(fileRef: UploadedFileRef): Promise<boolean> {
  if (!isIndexedDbMediaRef(fileRef.assetRef)) return false;
  try {
    const record = await getAssetRecord(extractAssetId(fileRef.assetRef));
    if (!record?.blob) return false;
    const url = URL.createObjectURL(record.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileRef.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves static URLs immediately and IndexedDB `idb://` asset references asynchronously.
 */
export function useResolvedMediaUrl(src?: string | null): {
  resolvedUrl: string | null;
  loading: boolean;
  missing: boolean;
} {
  const isIdb = isIndexedDbMediaRef(src);
  const initialCached = isIdb && src ? resolvedUrlCache.get(src) ?? null : src ?? null;

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(initialCached);
  const [loading, setLoading] = useState<boolean>(Boolean(isIdb && !initialCached));
  const [missing, setMissing] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setResolvedUrl(null);
      setLoading(false);
      setMissing(false);
      return;
    }
    if (!isIndexedDbMediaRef(src)) {
      setResolvedUrl(src);
      setLoading(false);
      setMissing(false);
      return;
    }

    const cached = resolvedUrlCache.get(src);
    if (cached) {
      setResolvedUrl(cached);
      setLoading(false);
      setMissing(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setMissing(false);

    resolveMediaUrl(src).then((url) => {
      if (cancelled) return;
      setResolvedUrl(url);
      setLoading(false);
      setMissing(!url);
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { resolvedUrl, loading, missing };
}
