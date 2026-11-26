'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import {
  hasRevealedKey,
  markRevealedKey,
  MOTION_TRACKS,
  useMotionSystem,
} from '../../context/MotionContext';

export interface KineticHeadingProps {
  /** Semantic heading level to preserve clean document outline */
  as?: 'h1' | 'h2' | 'h3';
  /** Exact plain text string to animate word-by-word */
  text: string;
  /** Optional accent suffix rendered inline in EDC crimson */
  accentText?: string;
  /** Unique session key so the heading never replays across internal navigation or remounts */
  replayKey: string;
  /** True for above-the-fold hero headings that should reveal immediately once preloader exits */
  immediate?: boolean;
  /** Optional responsive line break before accentText for intentional two-line desktop headlines */
  breakBeforeAccent?: 'never' | 'sm' | 'md';
  className?: string;
  accentClassName?: string;
}

/**
 * Public-facing editorial headline primitive.
 * - Synchronized with EdcPreloader via `introReady` so nothing completes unseen behind the curtain.
 * - Preserves a single semantic heading with accessible screen-reader text (`sr-only`).
 * - Respects `prefers-reduced-motion` and session replay suppression.
 * - Strictly reserved for selected public hero sections and major editorial headings.
 */
export const KineticHeading: React.FC<KineticHeadingProps> = ({
  as = 'h1',
  text,
  accentText,
  replayKey,
  immediate = false,
  breakBeforeAccent = 'never',
  className = '',
  accentClassName = 'text-[#C01E30] dark:text-[#F87171]',
}) => {
  const { introReady, reducedMotion } = useMotionSystem();
  const ref = useRef<HTMLHeadingElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  const alreadyRevealedOnMount = useRef<boolean>(hasRevealedKey(replayKey));
  const [hasAnimated, setHasAnimated] = useState<boolean>(alreadyRevealedOnMount.current);

  const shouldReveal =
    alreadyRevealedOnMount.current ||
    reducedMotion ||
    (introReady && (immediate || inView));

  useEffect(() => {
    if (shouldReveal && !hasAnimated) {
      markRevealedKey(replayKey);
      setHasAnimated(true);
    }
  }, [shouldReveal, hasAnimated, replayKey]);

  const baseWords = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const accentWords = useMemo(
    () => (accentText ? accentText.trim().split(/\s+/).filter(Boolean) : []),
    [accentText]
  );
  const fullAccessibleText = accentText ? `${text} ${accentText}` : text;

  const skipMotion = reducedMotion || alreadyRevealedOnMount.current;
  const HeadingTag = as;

  const { ease, headlineWordDuration, headlineWordStagger, headlineDistance } =
    MOTION_TRACKS.publicEditorial;

  return (
    <HeadingTag ref={ref} className={className}>
      {/* Clean continuous text for screen readers & assistive tech */}
      <span className="sr-only">{fullAccessibleText}</span>

      {/* Visual word-by-word kinetic reveal */}
      <span aria-hidden="true" className="inline">
        {baseWords.map((word, idx) => (
          <React.Fragment key={`b-${idx}`}>
            {skipMotion ? (
              <span className="inline-block">{word}</span>
            ) : (
              <motion.span
                initial={{
                  opacity: 0,
                  y: headlineDistance,
                  filter: 'blur(4px)',
                }}
                animate={
                  shouldReveal
                    ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                    : { opacity: 0, y: headlineDistance, filter: 'blur(4px)' }
                }
                transition={{
                  duration: headlineWordDuration,
                  delay: idx * headlineWordStagger,
                  ease,
                }}
                style={{ willChange: shouldReveal ? 'auto' : 'transform, opacity' }}
                className="inline-block"
              >
                {word}
              </motion.span>
            )}
            {idx < baseWords.length - 1 && ' '}
            {idx === baseWords.length - 1 && accentWords.length > 0 && (
              breakBeforeAccent === 'md' ? (
                <>
                  <br className="hidden md:block" />
                  <span className="md:hidden"> </span>
                </>
              ) : breakBeforeAccent === 'sm' ? (
                <>
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                </>
              ) : (
                ' '
              )
            )}
          </React.Fragment>
        ))}

        {accentWords.map((word, idx) => {
          const globalIdx = baseWords.length + idx;
          return (
            <React.Fragment key={`a-${idx}`}>
              {skipMotion ? (
                <span className={`inline-block ${accentClassName}`}>{word}</span>
              ) : (
                <motion.span
                  initial={{
                    opacity: 0,
                    y: headlineDistance,
                    filter: 'blur(4px)',
                  }}
                  animate={
                    shouldReveal
                      ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                      : { opacity: 0, y: headlineDistance, filter: 'blur(4px)' }
                  }
                  transition={{
                    duration: headlineWordDuration,
                    delay: globalIdx * headlineWordStagger,
                    ease,
                  }}
                  style={{ willChange: shouldReveal ? 'auto' : 'transform, opacity' }}
                  className={`inline-block ${accentClassName}`}
                >
                  {word}
                </motion.span>
              )}
              {idx < accentWords.length - 1 && ' '}
            </React.Fragment>
          );
        })}
      </span>
    </HeadingTag>
  );
};
