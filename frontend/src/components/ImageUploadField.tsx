'use client';

import { useState } from 'react';

interface Props {
  label: string;
  folder: 'avatars' | 'events' | 'guests';
  value: string;
  onChange: (newRef: string) => void;
}

export default function ImageUploadField({ label, folder, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNote('Please select an image file.');
      return;
    }

    setUploading(true);
    setNote('');
    try {
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
      formData.append('file', file);
      formData.append('fileName', file.name);
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
      setNote('Image uploaded to ImageKit.');
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
          placeholder="ImageKit path (e.g. /events/poster.jpg) or upload below"
        />
      </label>
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
