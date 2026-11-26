"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

// ── Utilities ────────────────────────────────────────────────────────────────

function detectUnsupportedBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isSafari =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("firefox");
  return isSafari || ua.includes("crios");
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ── Animation variants ───────────────────────────────────────────────────────

const buttonMotionVariants = {
  step1: { x: 0, width: 100 },
  step2: { x: -30, width: 220 },
};

const iconMotionVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: { x: 16, opacity: 1 },
};

const getResultVariants = (index: number, unsupported: boolean) => ({
  initial: { y: 0, scale: 0.3, filter: unsupported ? "none" : "blur(10px)" },
  animate: { y: (index + 1) * 50, scale: 1, filter: "blur(0px)" },
  exit: { y: unsupported ? 0 : -4, scale: 0.8 },
});

const getResultTransition = (index: number) => ({
  duration: 0.75,
  delay: index * 0.12,
  type: "spring" as const,
  bounce: 0.35,
  filter: { ease: "easeInOut" },
});

// ── Private sub-components ───────────────────────────────────────────────────

function SearchSvgIcon({ isUnsupported }: { isUnsupported: boolean }) {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? "none" : "blur(5px)" }}
      animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? "none" : "blur(5px)" }}
      transition={{ delay: 0.1, duration: 1, type: "spring", bounce: 0.15 }}
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
      />
    </motion.svg>
  );
}

function LoadingSvgIcon() {
  const lines: [number, number, number, number][] = [
    [128, 32, 128, 64],
    [195.88, 60.12, 173.25, 82.75],
    [224, 128, 192, 128],
    [195.88, 195.88, 173.25, 173.25],
    [128, 224, 128, 192],
    [60.12, 195.88, 82.75, 173.25],
    [32, 128, 64, 128],
    [60.12, 60.12, 82.75, 82.75],
  ];
  return (
    <svg
      className="gooey-search-loading"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      aria-label="Loading"
      role="status"
      style={{ width: 18, height: 18 }}
    >
      <rect width="256" height="256" fill="none" />
      {lines.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={16}
        />
      ))}
    </svg>
  );
}

function InfoSvgIcon({ index }: { index: number }) {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.12 + 0.3 }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
      style={{ width: 16, height: 16, position: "relative", top: 1, flexShrink: 0 }}
    >
      <path
        d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.49999C8.24992 4.9142 7.91413 5.24999 7.49992 5.24999C7.08571 5.24999 6.74992 4.9142 6.74992 4.49999C6.74992 4.08577 7.08571 3.74999 7.49992 3.74999C7.91413 3.74999 8.24992 4.08577 8.24992 4.49999ZM6.00003 5.99999H6.50003H7.50003C7.77618 5.99999 8.00003 6.22384 8.00003 6.49999V9.99999H8.50003H9.00003V11H8.50003H7.50003H6.50003H6.00003V9.99999H6.50003H7.00003V6.99999H6.50003H6.00003V5.99999Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </motion.svg>
  );
}

// ── Public types ─────────────────────────────────────────────────────────────

export interface SearchResultItem {
  id: string;
  title: string;
  category?: string;
  url?: string;
}

export interface GooeySearchProps {
  items?: (string | SearchResultItem)[];
  onSearch?: (query: string) => Promise<(string | SearchResultItem)[]> | (string | SearchResultItem)[];
  placeholder?: string;
  buttonLabel?: string;
  onSelect?: (item: string | SearchResultItem) => void;
  className?: string;
  debounceMs?: number;
  maxResults?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function GooeySearch({
  items = [
    "PitchBiz 5.0 Conclave",
    "FOKUS X E-Summit 2026",
    "Kriyeta Hackathon",
    "Campus Startup Initiative (CSI)",
    "AIIH Pre-Incubation Bay",
    "EDC Anchors & Mentors",
  ],
  onSearch,
  placeholder = "Search events, startups…",
  buttonLabel = "Search",
  onSelect,
  className,
  debounceMs = 300,
  maxResults = 5,
}: GooeySearchProps) {
  const uid = useId().replace(/:/g, "_");
  const filterId = `gooey-search-${uid}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<(string | SearchResultItem)[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isUnsupported = useMemo(() => detectUnsupportedBrowser(), []);
  const debouncedQuery = useDebounce(searchText, debounceMs);

  useEffect(() => {
    if (step === 2) inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!debouncedQuery) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let data: (string | SearchResultItem)[];
        if (onSearch) {
          data = await onSearch(debouncedQuery);
        } else {
          await new Promise<void>((r) => setTimeout(r, 200));
          data = items.filter((item) => {
            const str = typeof item === "string" ? item : `${item.title} ${item.category || ""}`;
            return str.toLowerCase().includes(debouncedQuery.trim().toLowerCase());
          });
        }
        if (!cancelled) setResults(data.slice(0, maxResults));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, items, onSearch, maxResults]);

  const btnPadding = isUnsupported ? "6px 12px" : "7px 16px";
  const resultPadding = isUnsupported ? "8px 14px" : "10px 18px";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <style>{`
        .gooey-search-loading {
          animation: gooeySearchSpin 0.6s linear infinite;
          transform-origin: center center;
        }
        @keyframes gooeySearchSpin { to { transform: rotate(180deg); } }
        .gooey-search-input::placeholder { color: currentColor; opacity: 0.6; }
      `}</style>

      {/* SVG gooey filter */}
      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -12"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Gooey container */}
      <div
        style={{
          filter: isUnsupported ? "none" : `url(#${filterId})`,
          cursor: "pointer",
          maxWidth: "max-content",
          position: "relative",
        }}
      >
        {/* Results */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key="results-wrapper"
            role="listbox"
            aria-label="Search results"
            style={{ position: "relative", zIndex: -1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: isUnsupported ? 0.3 : 0.8, duration: 0.4 }}
          >
            <AnimatePresence mode="popLayout">
              {results.map((item, index) => {
                const label = typeof item === "string" ? item : item.title;
                const sub = typeof item === "object" ? item.category : undefined;
                return (
                  <motion.div
                    key={label}
                    role="option"
                    tabIndex={0}
                    onClick={() => {
                      onSelect?.(item);
                      setStep(1);
                      setSearchText("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSelect?.(item);
                        setStep(1);
                      }
                    }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                    variants={getResultVariants(index, isUnsupported)}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={getResultTransition(index)}
                    style={{
                      backgroundColor: "var(--foreground)",
                      borderRadius: 30,
                      padding: resultPadding,
                      width: "100%",
                      minWidth: 220,
                      color: "var(--background)",
                      position: "absolute",
                      left: isUnsupported ? 0 : -30,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <InfoSvgIcon index={index} />
                      <div className="flex flex-col text-left">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.12 + 0.3 }}
                          className="truncate max-w-[180px]"
                        >
                          {label}
                        </motion.span>
                        {sub && (
                          <span className="text-[10px] opacity-70 font-mono -mt-0.5">{sub}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Morphing search pill */}
        <motion.div
          variants={buttonMotionVariants}
          initial="step1"
          animate={step === 1 ? "step1" : "step2"}
          transition={{ duration: 0.5, type: "spring", bounce: 0.15 }}
          onClick={() => step === 1 && setStep(2)}
          whileHover={{ scale: step === 2 ? 1 : 1.04 }}
          whileTap={{ scale: 0.96 }}
          role={step === 1 ? "button" : undefined}
          aria-label={step === 1 ? "Open search" : undefined}
          style={{
            backgroundColor: "var(--foreground)",
            color: "var(--background)",
            cursor: "pointer",
            letterSpacing: -0.2,
            outline: "none",
            border: "none",
            borderRadius: 9999,
            padding: btnPadding,
            height: 36,
            display: "flex",
            alignItems: "center",
          }}
        >
          {step === 1 ? (
            <div className="flex items-center gap-1.5 w-full justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span
                style={{
                  pointerEvents: "none",
                  color: "var(--background)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {buttonLabel}
              </span>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={searchText}
              className="gooey-search-input"
              placeholder={placeholder}
              aria-label="Search input"
              onChange={(e) => setSearchText(e.target.value)}
              onBlur={() => {
                if (!searchText) setStep(1);
              }}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                outline: "none",
                border: "none",
                color: "var(--background)",
                fontSize: 12,
                fontWeight: 600,
                paddingLeft: 6,
              }}
            />
          )}
        </motion.div>

        {/* Floating icon bubble */}
        <AnimatePresence mode="wait">
          {step === 2 && (
            <motion.div
              key="icon-bubble"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={iconMotionVariants}
              transition={{ delay: 0.05, duration: 0.5, type: "spring", bounce: 0.15 }}
              onClick={() => {
                setStep(1);
                setSearchText("");
              }}
              style={{
                position: "absolute",
                backgroundColor: "var(--foreground)",
                width: isUnsupported ? 32 : 36,
                height: isUnsupported ? 32 : 36,
                right: -6,
                top: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 9999,
                color: "var(--background)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {isLoading ? <LoadingSvgIcon /> : <SearchSvgIcon isUnsupported={isUnsupported} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GooeySearch;
