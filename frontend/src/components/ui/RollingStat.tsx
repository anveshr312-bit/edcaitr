'use client';

import React, { useMemo } from 'react';
import { CountUp, type CountUpEasing, type CountUpMode } from './CountUp';

/**
 * Formatted institutional stat counter powered by React Bits <CountUp />.
 * Parses strings like "2 Lakh+", "₹1.5 Cr+", "50+", "12 Teams", "45+", "4 Cities", or numeric KPIs
 * and animates cleanly to the exact final value without getting stuck between digits.
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
  duration = 1.15,
  delay = 0,
  replayOnHover = true,
  editorialDark = false,
  editorial = false,
}) => {
  const rawStr = String(value);

  const parsed = useMemo(() => {
    const match = rawStr.match(/^([^0-9]*)(\d+(?:,\d+)*(?:\.\d+)?)(.*)$/);
    if (!match) {
      return { prefix: '', target: null as number | null, decimals: 0, suffix: rawStr };
    }
    const [, prefix, numStr, suffix] = match;
    const cleanNum = numStr.replace(/,/g, '');
    const decimals = cleanNum.includes('.') ? cleanNum.split('.')[1].length : 0;
    return {
      prefix,
      target: parseFloat(cleanNum),
      decimals,
      suffix,
    };
  }, [rawStr]);

  const fontClass = editorial
    ? 'font-display font-bold tracking-[-0.03em] tabular-nums'
    : editorialDark
      ? 'font-mono-data dark:font-display dark:font-bold dark:tracking-[-0.03em] tabular-nums'
      : 'font-mono-data tabular-nums';

  if (parsed.target === null || Number.isNaN(parsed.target)) {
    return <span className={`${fontClass} ${className}`}>{rawStr}</span>;
  }

  return (
    <CountUp
      from={0}
      to={parsed.target}
      mode={mode}
      easing={easing}
      format="standard"
      separator=","
      decimals={parsed.decimals}
      prefix={parsed.prefix}
      suffix={parsed.suffix}
      direction="up"
      duration={duration}
      delay={delay}
      trigger="view"
      replayOnHover={replayOnHover}
      className={`${fontClass} ${className}`}
    />
  );
};
