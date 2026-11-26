"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import React, {
  type ComponentPropsWithoutRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

const inputWrapperClassName = cn(
  "relative w-full rounded-xl border border-border/60 bg-background/80 p-3 transition-all",
  "focus-within:border-[#C01E30]/70 focus-within:ring-2 focus-within:ring-[#C01E30]/20"
);

const inputClassName =
  "w-full bg-transparent outline-none placeholder:text-muted-foreground/50 text-foreground font-medium";

export type SmoothInputType = "text" | "password" | "email" | "url" | "tel";

export interface SmoothInputProps extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  type?: SmoothInputType;
  wrapperClassName?: string;
  fontSize?: number;
}

const PASSWORD_CHAR =
  typeof navigator !== "undefined" && navigator.userAgent.match(/firefox|fxios/i)
    ? "\u25CF"
    : "\u2022";

export const SmoothInput = ({
  className,
  wrapperClassName,
  value,
  defaultValue,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  style,
  fontSize = 14,
  ...props
}: SmoothInputProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const isControlled = value !== undefined;
  const inputValue = isControlled ? String(value ?? "") : internalValue;

  const springConfig = prefersReducedMotion
    ? { stiffness: 10000, damping: 100, mass: 0.1 }
    : { stiffness: 500, damping: 30, mass: 0.5 };

  const springCaretX = useSpring(caretX, springConfig);

  const syncMeasureSpan = () => {
    const input = inputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return;

    const styles = window.getComputedStyle(input);
    const isPassword = input.type === "password";

    let calculatedFontSize = styles.fontSize;
    if (
      PASSWORD_CHAR === "\u2022" &&
      isPassword &&
      !navigator.userAgent.match(/chrome|chromium|crios/i)
    ) {
      calculatedFontSize = `${parseFloat(calculatedFontSize) + 6.25}px`;
    }

    measureSpan.style.font = `${styles.fontStyle} ${styles.fontWeight} ${calculatedFontSize} ${styles.fontFamily}`;
    measureSpan.style.letterSpacing = styles.letterSpacing;
  };

  const measurePrefixWidth = (text: string) => {
    const input = inputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return null;

    syncMeasureSpan();
    measureSpan.textContent = text;

    const paddingLeft = parseFloat(window.getComputedStyle(input).paddingLeft) || 0;
    return text.length > 0 ? measureSpan.offsetWidth + paddingLeft : paddingLeft - 1;
  };

  const updateCaretFromInput = (target: HTMLInputElement) => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    const hasSelection = selectionStart !== selectionEnd;
    const caretIndex = target.selectionDirection === "backward" ? selectionStart : selectionEnd;
    const isPassword = target.type === "password";
    const textBeforeCaret = isPassword
      ? PASSWORD_CHAR.repeat(caretIndex)
      : target.value.slice(0, caretIndex);

    const absoluteWidth = measurePrefixWidth(textBeforeCaret);
    if (absoluteWidth === null) return;

    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const caretPosition = absoluteWidth - target.scrollLeft;
    const minX = paddingLeft - 1;
    const maxX = target.clientWidth - paddingRight;
    const isCaretVisible = caretPosition >= minX && caretPosition <= maxX + 1;

    caretX.set(Math.min(caretPosition, maxX));

    if (!isCaretVisible || hasSelection) {
      caretOpacity.set(0);
      return;
    }
    caretOpacity.set(1);
  };

  const updateCaretRef = useRef(updateCaretFromInput);
  updateCaretRef.current = updateCaretFromInput;

  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      updateCaretRef.current(input);
    }
  }, [inputValue, type, fontSize]);

  useEffect(() => {
    const input = inputRef.current;
    const container = containerRef.current;
    if (!input || !container) return;

    const updateCaretIfFocused = () => {
      if (document.activeElement === input) {
        updateCaretRef.current(input);
      }
    };

    const handleSelectionChange = () => {
      if (document.activeElement !== input) return;
      requestAnimationFrame(() => {
        if (document.activeElement === input) {
          updateCaretRef.current(input);
        }
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    input.addEventListener("scroll", updateCaretIfFocused);

    const resizeObserver = new ResizeObserver(updateCaretIfFocused);
    resizeObserver.observe(container);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      input.removeEventListener("scroll", updateCaretIfFocused);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={cn(inputWrapperClassName, wrapperClassName)}>
      <div
        ref={containerRef}
        className="relative grid grid-cols-1 p-0"
        style={{ caretColor: "transparent", fontSize }}
      >
        <input
          {...props}
          ref={inputRef}
          type={type}
          placeholder={placeholder}
          className={cn(
            inputClassName,
            "col-start-1 col-end-2 row-start-1 row-end-2 text-inherit",
            className
          )}
          style={style}
          value={inputValue}
          onChange={(e) => {
            if (!isControlled) setInternalValue(e.target.value);
            onChange?.(e);
            requestAnimationFrame(() => {
              updateCaretRef.current(e.target);
            });
          }}
          onFocus={(e) => {
            updateCaretRef.current(e.target);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            caretOpacity.set(0);
            onBlur?.(e);
          }}
        />
        <span
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre"
        />
        <motion.div
          className="bg-[#C01E30] pointer-events-none col-start-1 col-end-2 row-start-1 row-end-2 h-[1em] w-[2px] rounded-full self-center"
          style={{ x: springCaretX, opacity: caretOpacity }}
        />
      </div>
    </div>
  );
};

export default SmoothInput;
