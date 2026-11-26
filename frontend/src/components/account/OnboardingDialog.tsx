"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, GraduationCap, ShieldCheck, Ticket, Check, X } from "lucide-react";

interface Props {
  role: string;
}

export function OnboardingDialog({ role }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show to participants who haven't completed or dismissed the onboarding prompt
    if (role === "participant") {
      const answered = localStorage.getItem("edc_affiliation_answered");
      if (!answered) {
        setShow(true);
      }
    }
  }, [role]);

  if (!show) return null;

  const handleParticipantChoice = () => {
    localStorage.setItem("edc_affiliation_answered", "participant");
    setShow(false);
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs relative mb-6 animate-in fade-in duration-300">
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-medium border border-border/80 bg-secondary/60 text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C01E30]" />
            First-time member setup
          </div>
          <button
            type="button"
            onClick={handleParticipantChoice}
            className="text-muted-foreground hover:text-foreground text-xs font-medium cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            Are you an active or past member of EDC AITR?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
            Let us know your affiliation so we can tailor your workspace, permissions, and directory access.
          </p>
        </div>

        {/* 4 Affiliation Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Option 1: Participant */}
          <button
            type="button"
            onClick={handleParticipantChoice}
            className="flex flex-col text-left p-4 rounded-xl border border-border/60 bg-background/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2.5">
              <Ticket className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              Event Participant
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
              Attending summits, hackathons, or pitching at investor arenas.
            </p>
          </button>

          {/* Option 2: Core Team */}
          <Link
            href="/account/apply?role=core_team"
            onClick={() => localStorage.setItem("edc_affiliation_answered", "core_team")}
            className="flex flex-col text-left p-4 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-2.5">
              <Users className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-[#C01E30]">
              Core Team Member
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
              Active student coordinator managing logistics, tech, or media.
            </p>
          </Link>

          {/* Option 3: Alumni */}
          <Link
            href="/account/apply?role=alumni"
            onClick={() => localStorage.setItem("edc_affiliation_answered", "alumni")}
            className="flex flex-col text-left p-4 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-2.5">
              <GraduationCap className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-[#C01E30]">
              EDC Alumnus
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
              Former student cell member now working in industry or running a venture.
            </p>
          </Link>

          {/* Option 4: Advisor */}
          <Link
            href="/account/apply?role=advisor"
            onClick={() => localStorage.setItem("edc_affiliation_answered", "advisor")}
            className="flex flex-col text-left p-4 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-2.5">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-foreground group-hover:text-[#C01E30]">
              Faculty Advisor
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
              Acropolis faculty mentor or institutional advisory board member.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OnboardingDialog;
