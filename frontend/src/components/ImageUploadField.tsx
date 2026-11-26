'use client';

import React, { useState } from 'react';
import { Camera, Check, Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react';

type UploadFolder = 'avatars' | 'events' | 'guests' | 'highlights';

const UPLOAD_SPECS: Record<
  UploadFolder,
  { ratio: string; dimensions: string; maxMb: number; maxWidth: number }
> = {
  avatars: { ratio: '1:1 (Square)', dimensions: '400 × 400 px', maxMb: 2, maxWidth: 800 },
  guests: { ratio: '1:1 (Square)', dimensions: '400 × 400 px', maxMb: 2, maxWidth: 800 },
  events: { ratio: '16:9 (Landscape)', dimensions: '1200 × 675 px', maxMb: 5, maxWidth: 1600 },
  highlights: { ratio: '16:9 or 4:3', dimensions: '1600 × 900 px', maxMb: 5, maxWidth: 1920 },
};

interface Props {
  label: string;
  folder: UploadFolder;
  value: string;
  onChange: (newRef: string) => void;
}

async function convertToWebp(file: File, maxWidth: number): Promise<File> {
  if (file.type === 'image/webp' && file.size <= 500 * 1024) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.88),
  );
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
}

export default function ImageUploadField({ label, folder, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const spec = UPLOAD_SPECS[folder];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (!rawFile.type.startsWith('image/')) {
      setNote('Please select a valid image file (PNG, JPG, WebP).');
      setIsSuccess(false);
      return;
    }
    if (rawFile.size > spec.maxMb * 1024 * 1024) {
      setNote(`File exceeds maximum allowed size of ${spec.maxMb} MB.`);
      setIsSuccess(false);
      return;
    }

    setUploading(true);
    setNote('Optimizing and converting to WebP…');
    setIsSuccess(false);
    try {
      const webpFile = await convertToWebp(rawFile, spec.maxWidth);
      const savedPct =
        rawFile.size > 0
          ? Math.max(0, Math.round(((rawFile.size - webpFile.size) / rawFile.size) * 100))
          : 0;

      const signRes = await fetch('/api/media/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) {
        throw new Error(signData.error ?? 'Image upload is not configured yet.');
      }

      const formData = new FormData();
      formData.append('file', webpFile);
      formData.append('fileName', webpFile.name);
      formData.append('publicKey', signData.publicKey);
      formData.append('signature', signData.signature);
      formData.append('expire', String(signData.expire));
      formData.append('token', signData.token);
      formData.append('folder', signData.folder);

      const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });
      const uploaded = await uploadRes.json();
      if (!uploadRes.ok || !uploaded.filePath) {
        throw new Error(uploaded.message ?? 'Upload failed.');
      }

      onChange(uploaded.filePath);
      setIsSuccess(true);
      setNote(
        `Optimized to WebP (${Math.round(webpFile.size / 1024)} KB${savedPct > 0 ? `, ${savedPct}% smaller` : ''}) and uploaded.`,
      );
    } catch (err) {
      setIsSuccess(false);
      setNote(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </label>
        <span className="text-[11px] text-[var(--text-muted)]">
          {spec.ratio} · max {spec.maxMb}MB
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Preview Circle / Box */}
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.startsWith('http') ? value : `https://ik.imagekit.io/edcaitr/${value.replace(/^\//, '')}`}
              alt={label}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback icon if image path doesn't load
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="h-8 w-8 stroke-1 text-[var(--text-muted)]" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
              <Loader2 className="h-6 w-6 animate-spin text-[#C01E30]" />
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="flex-1 space-y-2 w-full">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ImageKit path (e.g. /events/poster.webp) or upload new"
            className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2 text-xs text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
          />

          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-2-mood)] shadow-sm transition-all hover:bg-[var(--surface-subtle)] hover:border-[#C01E30]/40">
              <UploadCloud className="h-3.5 w-3.5 text-[#C01E30]" />
              <span>{uploading ? 'Processing…' : 'Upload Image'}</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => void handleFileChange(e)}
                className="sr-only"
              />
            </label>
            <span className="text-[11px] text-[var(--text-muted)]">
              Auto-converts to WebP {spec.dimensions}
            </span>
          </div>
        </div>
      </div>

      {note && (
        <div
          className={`flex items-center gap-1.5 text-xs ${
            isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {isSuccess && <Check className="h-3.5 w-3.5" />}
          <span>{note}</span>
        </div>
      )}
    </div>
  );
}
