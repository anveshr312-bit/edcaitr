"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface TeamRevealMember {
  id: string;
  name: string;
  role: string;
  expertise?: string;
  bio?: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
  accent?: string;
  linkedinUrl?: string;
  company?: string;
  tier?: "director" | "advisor" | "core_team";
}

export interface TeamRevealGridProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "title"> {
  eyebrow?: string;
  title?: string;
  description?: string;
  members?: readonly TeamRevealMember[];
  activeMemberId?: string | null;
  defaultActiveMemberId?: string | null;
  onActiveMemberChange?: (memberId: string | null) => void;
  onMemberClick?: (member: TeamRevealMember) => void;
  autoPlay?: boolean;
  rotationInterval?: number;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function Portrait({ member, active }: { member: TeamRevealMember; active: boolean }) {
  const style = {
    "--team-accent": member.accent ?? "#C01E30",
  } as React.CSSProperties;

  return (
    <div
      style={style}
      className={cn(
        "relative h-full overflow-hidden rounded-xl bg-neutral-100 transition-all duration-300 dark:bg-neutral-900 border border-border/40",
        active && "border-[#C01E30]/60 ring-2 ring-[#C01E30]/20"
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 opacity-20 transition-opacity duration-300",
          active && "opacity-60"
        )}
        style={{
          background:
            "radial-gradient(circle at 68% 20%, color-mix(in srgb, var(--team-accent) 25%, transparent), transparent 45%)",
        }}
      />

      {member.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt={member.imageAlt ?? member.name}
          loading="lazy"
          draggable={false}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out",
            // NOTE: Grayscale intentionally REMOVED per user explicit instruction
            active ? "scale-105" : "scale-100"
          )}
          style={{ objectPosition: member.imagePosition ?? "center top" }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-white font-bold text-2xl">
          <span className="w-14 h-14 rounded-full bg-[#C01E30]/20 text-[#C01E30] border border-[#C01E30]/30 flex items-center justify-center">
            {initials(member.name)}
          </span>
        </div>
      )}

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300",
          active ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

export function TeamRevealGrid({
  eyebrow = "Institutional Leadership & Execution",
  title = "EDC ANCHORS",
  description = "The institutional leadership, strategic advisors, and student operators piloting Central India’s premier venture ecosystem.",
  members = [],
  activeMemberId,
  defaultActiveMemberId,
  onActiveMemberChange,
  onMemberClick,
  autoPlay = false,
  rotationInterval = 3200,
  className,
  ...props
}: TeamRevealGridProps) {
  const firstMemberId = members[0]?.id ?? null;
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    defaultActiveMemberId === undefined ? firstMemberId : defaultActiveMemberId
  );
  const [interacting, setInteracting] = useState(false);
  const isControlled = activeMemberId !== undefined;

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const requestedActiveId = isControlled ? activeMemberId : internalActiveId;
  const resolvedActiveId =
    requestedActiveId && memberIds.has(requestedActiveId) ? requestedActiveId : firstMemberId;

  const selectMember = useCallback(
    (memberId: string | null) => {
      if (!isControlled) setInternalActiveId(memberId);
      onActiveMemberChange?.(memberId);
    },
    [isControlled, onActiveMemberChange]
  );

  useEffect(() => {
    if (!autoPlay || interacting || members.length < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      const currentIndex = members.findIndex((m) => m.id === resolvedActiveId);
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % members.length;
      selectMember(members[nextIndex]?.id ?? null);
    }, Math.max(rotationInterval, 1500));

    return () => window.clearInterval(timer);
  }, [autoPlay, interacting, members, resolvedActiveId, rotationInterval, selectMember]);

  return (
    <section className={cn("relative w-full py-8 text-foreground", className)} {...props}>
      <header className="mb-10 text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-medium border border-border/80 bg-secondary/60 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C01E30]" />
          {eyebrow}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </header>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {members.map((member) => {
          const active = member.id === resolvedActiveId;
          const detailsId = `anchor-${member.id}-details`;

          return (
            <li key={member.id} className="relative min-w-0">
              <button
                type="button"
                aria-expanded={active}
                aria-controls={detailsId}
                onClick={() => {
                  selectMember(member.id);
                  onMemberClick?.(member);
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") {
                    setInteracting(true);
                    selectMember(member.id);
                  }
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") setInteracting(false);
                }}
                onFocus={() => {
                  setInteracting(true);
                  selectMember(member.id);
                }}
                onBlur={() => setInteracting(false)}
                className="group block w-full text-left outline-none cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-2 shadow-sm transition-all duration-300 group-hover:border-[#C01E30]/40 group-hover:shadow-md">
                  <div className="h-44 sm:h-52 w-full">
                    <Portrait member={member} active={active} />
                  </div>

                  <div className="p-3 text-center space-y-1">
                    {/* Member name - prominent */}
                    <h3 className="truncate text-sm sm:text-base font-bold text-foreground tracking-tight">
                      {member.name}
                    </h3>
                    {/* Role / Company - without internal operational tags */}
                    {member.role && (
                      <p className="truncate text-xs font-semibold text-[#C01E30]">
                        {member.role}
                      </p>
                    )}
                    {member.company && (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {member.company}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default TeamRevealGrid;
