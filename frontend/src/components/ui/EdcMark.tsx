import React from 'react';

/**
 * Shared official EDC AITR geometric monogram constants & SVG component.
 * Derived directly from the official EDC logo with exact proportions (1076:856)
 * and signature crimson (#BD011F) in two seamless closed contours.
 */
export const EDC_MARK_VIEWBOX = '0 0 1076 856';
export const EDC_MARK_WIDTH = 1076;
export const EDC_MARK_HEIGHT = 856;
export const EDC_CRIMSON = '#BD011F';

export const EDC_CONTOUR_PATHS = {
  /** Upper left 'e' hemisphere dome (single closed contour). */
  eUpper: 'M 6.5 395 A 186.5 194 0 0 1 370.5 395 Z',
  /** Unified seamless outer + inner contour of lower 'e' + 'D' + 'C' (zero internal seams). */
  main: 'M 161 2 A 446.5 426 0 0 1 551.5 218.9 A 300.5 320 0 0 1 1061.5 358 L 927.8 358 A 176.5 189 0 1 0 928.7 521 L 1060.7 521 A 300.5 320 0 0 1 544.4 648.7 A 446.5 426 0 0 1 161 854 L 161 656 Q 222 656 256 648 L 256 725.2 A 316 314 0 0 0 452.2 532 L 351.4 532 A 186.5 194 0 0 1 8.2 487 L 464.4 487 A 316 314 0 0 0 256 130.8 L 256 202 L 161 202 Z',
} as const;

export interface EdcMarkProps {
  className?: string;
  color?: string;
  title?: string;
  ariaHidden?: boolean;
}

export const EdcMark: React.FC<EdcMarkProps> = ({
  className = 'h-8 w-auto',
  color = EDC_CRIMSON,
  title = 'EDC AITR',
  ariaHidden = false,
}) => (
  <svg
    viewBox={EDC_MARK_VIEWBOX}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="geometricPrecision"
    className={className}
    role={ariaHidden ? undefined : 'img'}
    aria-hidden={ariaHidden || undefined}
    aria-label={ariaHidden ? undefined : title}
  >
    <path d={EDC_CONTOUR_PATHS.main} fill={color} />
    <path d={EDC_CONTOUR_PATHS.eUpper} fill={color} />
  </svg>
);

/**
 * Repeating holographic foil mask pattern using the official EDC monogram.
 * Used on Alumni Connect 3D ProfileCards so specular foil highlights shimmer
 * with authentic tiled EDC emblems.
 */
export const EDC_MONOGRAM_FOIL_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='100' viewBox='0 0 120 100'>
    <g transform='translate(14 14) scale(0.056)' fill='#ffffff' fill-opacity='0.95'>
      <path d='${EDC_CONTOUR_PATHS.main}'/>
      <path d='${EDC_CONTOUR_PATHS.eUpper}'/>
    </g>
    <g transform='translate(74 58) scale(0.036)' fill='#ffffff' fill-opacity='0.68'>
      <path d='${EDC_CONTOUR_PATHS.main}'/>
      <path d='${EDC_CONTOUR_PATHS.eUpper}'/>
    </g>
  </svg>`
)}`;

export default EdcMark;
