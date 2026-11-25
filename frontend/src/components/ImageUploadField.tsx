'use client';

import { useState } from 'react';

type UploadFolder = 'avatars' | 'events' | 'guests' | 'highlights';

const UPLOAD_SPECS: Record<UploadFolder, { ratio: string; dimensions: string; maxMb: number; maxWidth: number }> = {
  avatars:    { ratio: '1:1 (Square)',    dimensions: '400 × 400 px',  maxMb: 2, maxWidth: 800 },
  guests:     { ratio: '1:1 (Square)',    dimensions: '400 × 400 px',  maxMb: 2, maxWidth: 800 },
  events:     { ratio: '16:9 (Landscape)', dimensions: '1200 × 675 px', maxMb: 5, maxWidth: 1600 },
  highlights: { ratio: '16:9 or 4:3',     dimensions: '1600 × 900 px', maxMb: 5, maxWidth: 1920 },
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
    canvas.toBlob(resolve, 'image/webp', 0.88)
  );
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
}

export default function ImageUploadField({ label, folder, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');
  const spec = UPLOAD_SPECS[folder];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (!rawFile.type.startsWith('image/')) {
      setNote('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (rawFile.size > spec.maxMb * 1024 * 1024) {
      setNote(`File exceeds maximum allowed size of ${spec.maxMb} MB.`);
      return;
    }

    setUploading(true);
    setNote('Converting to WebP…');
    try {
      const webpFile = await convertToWebp(rawFile, spec.maxWidth);
      const savedPct = rawFile.size > 0
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
      setNote(
        `Converted to WebP (${Math.round(webpFile.size / 1024)} KB${savedPct > 0 ? `, ${savedPct}% smaller` : ''}) and uploaded.`
      );
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label>
        {label}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ImageKit path (e.g. /events/poster.webp) or upload below"
        />
      </label>
      <span className="mono-meta" style={{ fontSize: '0.78rem' }}>
        Recommended: {spec.ratio} · {spec.dimensions} · Max {spec.maxMb} MB · Auto-converted to WebP
      </span>
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => void handleFileChange(e)}
        style={{ padding: 6, fontSize: '0.85rem' }}
      />
      {note && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{note}</span>}
    </div>
  );
}
