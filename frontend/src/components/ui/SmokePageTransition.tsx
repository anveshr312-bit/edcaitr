'use client';

import React, { useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export interface SmokePageTransitionProps {
  routeKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Atmospheric Smoke / Vapor Page Transition for EDC AITR.
 * Dissolves departing pages into soft drifting mist and materializes incoming
 * pages out of a brief translucent crimson-obsidian smoke plume (~380ms total)
 * while preserving persistent layouts (Header, Sidebar, CursorGrid).
 */
let hasCompletedInitialRender = false;

export const SmokePageTransition: React.FC<SmokePageTransitionProps> = ({
  routeKey,
  children,
  className = '',
}) => {
  const prefersReduced = useReducedMotion();
  const filterUid = useId().replace(/:/g, '');
  const smokeFilterId = `edc-smoke-turb-${filterUid}`;
  const isInitialRenderRef = useRef(!hasCompletedInitialRender);

  if (!hasCompletedInitialRender) {
    hasCompletedInitialRender = true;
  }
  const isInitialRender = isInitialRenderRef.current;

  return (
    <div className={`relative ${className}`.trim()}>
      {/* Hidden SVG turbulence filter for organic atmospheric smoke veil */}
      {!prefersReduced && (
        <svg
          aria-hidden="true"
          className="pointer-events-none fixed h-0 w-0 opacity-0"
          focusable="false"
        >
          <defs>
            <filter id={smokeFilterId} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.018"
                numOctaves={3}
                seed={7}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={36}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* Drifting Smoke Plume Sweep on Route Change */}
      {!prefersReduced && (
        <AnimatePresence initial={false}>
          <motion.div
            key={`smoke-veil-${routeKey}`}
            aria-hidden="true"
            initial={{ opacity: 0.72, y: 18, scale: 1.03 }}
            animate={{ opacity: 0, y: -34, scale: 1.12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-0 z-30 overflow-hidden no-print"
          >
            <div
              className="absolute -inset-12"
              style={{
                filter: `url(#${smokeFilterId}) blur(24px)`,
                background:
                  'radial-gradient(62% 48% at 24% 38%, rgba(192, 30, 48, 0.14) 0%, transparent 70%), radial-gradient(58% 52% at 76% 62%, rgba(18, 20, 26, 0.24) 0%, transparent 72%), radial-gradient(74% 64% at 50% 50%, rgba(120, 124, 138, 0.16) 0%, transparent 76%)',
              }}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Incoming / Departing Route Surface */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={routeKey}
          initial={
            isInitialRender
              ? false
              : prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, y: 12, scale: 0.994, filter: 'blur(7px)' }
          }
          animate={
            prefersReduced
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
          }
          exit={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, y: -8, scale: 0.996, filter: 'blur(5px)' }
          }
          transition={{
            duration: prefersReduced ? 0.16 : 0.32,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SmokePageTransition;
