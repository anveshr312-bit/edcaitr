'use client';

import React, { useRef, useState } from 'react';
import { AlertCircle, Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { AvatarMeta } from '../../types/portal';
import {
  deleteStoredMedia,
  formatBytes,
  validateAndStoreAvatarImage,
} from '../../utils/mediaStorage';
import { MemberAvatar } from './MemberAvatar';

interface AvatarUploaderProps {
  name: string;
  avatarUrl?: string;
  avatarPosition?: string;
  avatarMeta?: AvatarMeta;
  disabled?: boolean;
  onChange: (next: {
    avatarUrl?: string;
    avatarPosition: string;
    avatarMeta?: AvatarMeta;
  }) => void;
}

const FOCAL_POSITIONS = [
  { label: 'Top', value: '50% 20%' },
  { label: 'Center', value: '50% 50%' },
  { label: 'Lower', value: '50% 80%' },
];

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  name,
  avatarUrl,
  avatarPosition = '50% 50%',
  avatarMeta,
  disabled = false,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file || disabled) return;
    setError(null);
    setUploading(true);
    try {
      const result = await validateAndStoreAvatarImage(file);
      onChange({
        avatarUrl: result.assetRef,
        avatarPosition,
        avatarMeta: result.meta,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload portrait.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (disabled) return;
    setError(null);
    const previousRef = avatarUrl;
    onChange({
      avatarUrl: undefined,
      avatarPosition: '50% 50%',
      avatarMeta: undefined,
    });
    if (previousRef) {
      await deleteStoredMedia(previousRef);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          void handleFile(file);
        }}
        className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-[10px] border transition-colors ${
          dragActive
            ? 'border-[#C01E30] bg-[var(--accent-soft)]/50'
            : 'border-[var(--border-hairline)] bg-[var(--surface-subtle)]/55'
        }`}
      >
        <div className="relative shrink-0 self-start">
          <MemberAvatar
            name={name}
            avatarUrl={avatarUrl}
            avatarPosition={avatarPosition}
            size="xl"
            tone="obsidian"
          />
          {uploading && (
            <span className="absolute inset-0 rounded-[12px] bg-black/55 flex items-center justify-center text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          <div>
            <p className="text-sm font-medium text-[var(--color-2-mood)]">
              Member Portrait
            </p>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5 leading-relaxed">
              Square 1:1 framing recommended (JPEG, PNG, or WebP · max 5 MB · min 160×160px).
              Initials fallback appears automatically when no photo is uploaded.
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || uploading}
            onChange={(e) => void handleFile(e.target.files?.[0])}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-medium border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--color-2-mood)] hover:border-[#C01E30] hover:text-[#C01E30] dark:hover:text-[#F87171] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {avatarUrl ? <Camera className="h-3.5 w-3.5" /> : <ImagePlus className="h-3.5 w-3.5" />}
              <span>{avatarUrl ? 'Replace Portrait' : 'Upload Portrait'}</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => void handleRemove()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-xs font-medium text-[var(--ink-muted)] hover:text-[#C01E30] dark:hover:text-[#F87171] disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {avatarUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-hairline)]">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
                <span>Crop Focus:</span>
                {FOCAL_POSITIONS.map((opt) => {
                  const active = avatarPosition === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        onChange({
                          avatarUrl,
                          avatarPosition: opt.value,
                          avatarMeta,
                        })
                      }
                      className={`px-2 py-0.5 rounded-[5px] text-[11px] font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-[var(--color-2-mood)] text-[var(--surface)]'
                          : 'text-[var(--ink-secondary)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {avatarMeta && (
                <span className="font-mono-data text-[10px] text-[var(--ink-muted)]">
                  {avatarMeta.width}×{avatarMeta.height}px · {formatBytes(avatarMeta.size)} · Browser IndexedDB
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 px-3 py-2 rounded-[8px] border border-[#C01E30]/35 bg-[var(--accent-soft)] text-xs text-[#C01E30] dark:text-[#F87171]"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
