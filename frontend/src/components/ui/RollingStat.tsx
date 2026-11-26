'use client';

import React from 'react';
import CountUp, { type CountUpEasing, type CountUpMode } from './CountUp';

/**
 * Parses numeric stats from strings like "2 Lakh+", "₹1.5 Cr+", "50+", "12 Teams", "45+", "4 Cities"
 */
function parseStatValue(raw: string | number) {
  if (typeof raw === 'number') {
    return { to: raw, from: 0, prefix: '', suffix: '', decimals: raw % 1 !== 0 ? 1 : 0 };
  }
  const str = String(raw).trim();
  const match = str.match(/^([^0-9.-]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) {
    return null;
  }
  const prefix = match[1] || '';
  const numStr = match[2];
  const suffix = match[3] || '';
  const num = parseFloat(numStr);
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  return { to: num, from: 0, prefix, suffix, decimals };
}

/**
 * Formatted institutional stat counter powered by React Bits <CountUp />.
 * Counts up smoothly when in view, and replays on hover.
 */
export const RollingStat: React.FC<{
  value: string | number;
  className?: string;
  mode?: CountUpMode;
  easing?: CountUpEasing;
  duration?: number;
  delay?: number;
  replayOnHover?: boolean;
  editorialDark?: boolean;
  editorial?: boolean;
}> = ({
  value,
  className = '',
  mode = 'count',
  easing = 'easeOut',
  duration = 1.8,
  delay = 0,
  replayOnHover = true,
  editorialDark = false,
  editorial = false,
}) => {
  const fontClass = editorial
    ? 'font-display font-bold'
    : editorialDark
      ? 'font-mono-data dark:font-display'
      : 'font-mono-data';

  const parsed = parseStatValue(value);

  if (!parsed) {
    return (
      <span className={`rolling-stat inline-block tabular-nums ${fontClass} ${className}`}>
        {value}
      </span>
    );
  }

  return (
    <CountUp
      to={parsed.to}
      from={parsed.from}
      decimals={parsed.decimals}
      prefix={parsed.prefix}
      suffix={parsed.suffix}
      mode={mode}
      easing={easing}
      duration={duration}
      delay={delay}
      trigger="view"
      replayOnHover={replayOnHover}
      className={`rolling-stat inline-block tabular-nums ${fontClass} ${className}`}
    />
  );
};
