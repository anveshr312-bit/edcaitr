'use client';

import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { EDITORIAL_IMAGES } from '../../data/seedData';
import { EventThumbnailMeta } from '../../types/portal';
import { EditorialImage, StatusBadge, StudioButton } from '../ui/Primitives';
import {
  deleteStoredMedia,
  formatBytes,
  isIndexedDbMediaRef,
  validateAndStoreEventThumbnail,
} from '../../utils/mediaStorage';

const PRESET_BANNERS: Array<{ label: string; src: string; alt: string }> = [
  {
    label: 'Summit Stage',
    src: EDITORIAL_IMAGES.summitStage,
    alt: 'Main auditorium summit stage at AITR Indore',
  },
  {
    label: 'Hackathon Sprint',
    src: EDITORIAL_IMAGES.kriyetaSprint,
    alt: 'Student builders collaborating during hackathon sprint',
  },
  {
    label: 'CSI FabLab',
    src: EDITORIAL_IMAGES.csiFablab,
    alt: 'Campus Startup Initiative prototyping floor at AIIH',
  },
  {
    label: 'Founders Session',
    src: EDITORIAL_IMAGES.heroFounders,
    alt: 'Student founders and mentors in an interactive session',
  },
];

const FOCAL_PRESETS: Array<{ label: string; value: string }> = [
  { label: 'Top Focus', value: '50% 20%' },
  { label: 'Center Crop', value: '50% 50%' },
  { label: 'Lower Focus', value: '50% 80%' },
];

export interface EventThumbnailUploaderProps {
  bannerImage: string;
  bannerAlt: string;
  bannerPosition: string;
  thumbnailMeta?: EventThumbnailMeta;
  eventTitle: string;
  onChange: (patch: {
    bannerImage?: string;
    bannerAlt?: string;
    bannerPosition?: string;
    thumbnailMeta?: EventThumbnailMeta;
  }) => void;
}

export const EventThumbnailUploader: React.FC<EventThumbnailUploaderProps> = ({
  bannerImage,
  bannerAlt,
  bannerPosition,
  thumbnailMeta,
  eventTitle,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomUploaded = isIndexedDbMediaRef(bannerImage);

  const processFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const previousRef = bannerImage;
      const result = await validateAndStoreEventThumbnail(file);
      onChange({
        bannerImage: result.assetRef,
        bannerAlt: bannerAlt.trim() || `${eventTitle || 'EDC AITR Event'} cover artwork`,
        thumbnailMeta: result.meta,
      });
      if (isIndexedDbMediaRef(previousRef) && previousRef !== result.assetRef) {
        void deleteStoredMedia(previousRef);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process selected image.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleRemoveUploaded = () => {
    if (isIndexedDbMediaRef(bannerImage)) {
      void deleteStoredMedia(bannerImage);
    }
    onChange({
      bannerImage: EDITORIAL_IMAGES.summitStage,
      bannerPosition: '50% 50%',
      thumbnailMeta: undefined,
    });
    setError(null);
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        className="hidden"
        aria-label="Upload event cover thumbnail"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Live 16:9 Editorial Preview */}
        <div className="lg:col-span-7 space-y-2.5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative aspect-[16/9] rounded-[10px] overflow-hidden border transition-colors ${
              dragging
                ? 'border-[#C01E30] ring-2 ring-[#C01E30]/20 bg-[var(--accent-soft)]'
                : 'border-[var(--border-strong)] bg-[var(--surface-subtle)]'
            }`}
          >
            <EditorialImage
              src={bannerImage}
              alt={bannerAlt || eventTitle || 'Event cover preview'}
              objectPosition={bannerPosition || '50% 50%'}
              fallbackTitle="16:9 Event Thumbnail Preview"
            />
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
              <StatusBadge
                label={isCustomUploaded ? 'Uploaded Cover (16:9)' : 'Institutional Preset'}
                tone={isCustomUploaded ? 'green' : 'neutral'}
              />
            </div>
            {dragging && (
              <div className="absolute inset-0 bg-[#030405]/65 flex flex-col items-center justify-center text-white p-4 text-center">
                <Upload className="h-6 w-6 mb-2" />
                <p className="text-sm font-semibold">Drop JPEG, PNG, or WebP cover image</p>
                <p className="text-xs text-white/75 mt-0.5">Recommended 16:9 · Max 5 MB</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[var(--ink-muted)] mr-1">Crop Framing:</span>
              {FOCAL_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onChange({ bannerPosition: preset.value })}
                  className={`px-2.5 py-1 rounded-[6px] border text-[11px] font-medium transition-colors cursor-pointer ${
                    (bannerPosition || '50% 50%') === preset.value
                      ? 'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border-[#030405] dark:border-[#F1F0ED]'
                      : 'bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border-hairline)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {thumbnailMeta && isCustomUploaded && (
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                {thumbnailMeta.width}×{thumbnailMeta.height}px · {formatBytes(thumbnailMeta.size)}
              </span>
            )}
          </div>
        </div>

        {/* Upload Controls & Metadata */}
        <div className="lg:col-span-5 space-y-3.5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="p-4 rounded-[9px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <div className="h-9 w-9 rounded-[8px] bg-[var(--surface)] border border-[var(--border-hairline)] flex items-center justify-center text-[#C01E30] shrink-0">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--color-2-mood)]">
                  Upload Custom Event Thumbnail
                </p>
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 leading-relaxed">
                  Optional · Recommended 16:9 (1600×900px) · JPEG, PNG, or WebP up to 5 MB.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StudioButton
                type="button"
                variant="secondary"
                size="sm"
                loading={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {isCustomUploaded ? <RefreshCw className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                <span>{isCustomUploaded ? 'Replace Image' : 'Choose Image'}</span>
              </StudioButton>
              {isCustomUploaded && (
                <StudioButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveUploaded}
                  className="text-[#C01E30] dark:text-[#E67C87]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </StudioButton>
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded-[7px] bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-start gap-2 text-xs text-[#C01E30] dark:text-[#E67C87]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isCustomUploaded && thumbnailMeta && !error && (
              <div className="p-2.5 rounded-[7px] bg-[#ECFDF3] dark:bg-emerald-950/50 border border-[#BBF7D0] dark:border-emerald-800/70 flex items-start gap-2 text-[11px] text-[#15803D] dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="truncate">
                  Stored: <strong className="font-semibold">{thumbnailMeta.name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Alt Text */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
              Cover Image Alt Text (Accessibility)
            </label>
            <input
              type="text"
              value={bannerAlt}
              onChange={(e) => onChange({ bannerAlt: e.target.value })}
              placeholder="e.g. Founders speaking on the AITR main auditorium stage"
              className="studio-input text-xs"
            />
          </div>

          {/* Institutional Presets */}
          <div>
            <p className="text-[11px] font-medium text-[var(--ink-muted)] mb-1.5">
              Or select an EDC institutional cover preset:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_BANNERS.map((preset) => {
                const active = bannerImage === preset.src;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onChange({
                        bannerImage: preset.src,
                        bannerAlt: bannerAlt || preset.alt,
                        thumbnailMeta: undefined,
                      })
                    }
                    className={`px-2.5 py-1.5 rounded-[7px] border text-left text-[11px] font-medium transition-colors cursor-pointer ${
                      active
                        ? 'border-[#C01E30] bg-[var(--accent-soft)] text-[#C01E30] dark:text-[#E67C87]'
                        : 'border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 rounded-[7px] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex items-start gap-2 text-[11px] text-[var(--ink-muted)] leading-relaxed">
            <Database className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--ink-secondary)]" />
            <span>
              Browser-local prototype storage: uploaded images are persisted in this browser’s IndexedDB
              (survives page reloads; not synced to external cloud storage).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
