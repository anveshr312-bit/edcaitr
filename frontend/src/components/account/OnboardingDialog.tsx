"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Ticket,
  BookOpen,
  Calendar,
  Handshake,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";

interface Props {
  role: string;
}

export function OnboardingDialog({ role }: Props) {
  const [show, setShow] = useState(false);
  const [coreTeamDomainStep, setCoreTeamDomainStep] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

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

  const handleDomainSelect = async (domainValue: string | null) => {
    setSaving(true);
    try {
      localStorage.setItem("edc_affiliation_answered", "core_team");
      if (domainValue) {
        localStorage.setItem("edc_core_team_domain", domainValue);
      }
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && domainValue) {
          await supabase.from("profiles").update({ domain: domainValue }).eq("id", user.id);
        }
      }
    } catch (err) {
      console.warn("Could not save domain during onboarding", err);
    } finally {
      setShow(false);
      router.push("/account/apply?role=core_team" + (domainValue ? `&domain=${domainValue}` : ""));
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 shadow-xs relative mb-6 animate-in fade-in duration-300">
      <div className="relative z-10 space-y-4">
        {coreTeamDomainStep ? (
          /* Step 2: Core Team Operating Domain Selection */
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCoreTeamDomainStep(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to roles</span>
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-medium border border-border/80 bg-secondary/60 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C01E30]" />
                Core Team · Domain Affiliation
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Select your operating domain (or choose later)
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
                Every core member belongs to one of three operational pillars under the EDC AITR team structure:
              </p>
            </div>

            {/* 4 Domain Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* Domain 1: Research & Digital Communications */}
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleDomainSelect("research_digital")}
                className="flex flex-col text-left p-4 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-2.5">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-[#C01E30]">
                  Research &amp; Digital
                </h4>
                <div className="text-[10px] font-mono text-[#C01E30] dark:text-[#E67C87] mt-0.5">
                  Knowledge &amp; Content
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                  Market trends, founder case studies, scheme radars, podcasts, and digital calendars.
                </p>
              </button>

              {/* Domain 2: Programs & Experiences */}
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleDomainSelect("programs_experiences")}
                className="flex flex-col text-left p-4 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-2.5">
                  <Calendar className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-[#C01E30]">
                  Programs &amp; Experiences
                </h4>
                <div className="text-[10px] font-mono text-[#C01E30] dark:text-[#E67C87] mt-0.5">
                  Design &amp; Outcomes
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                  Event interventions, bootcamps, speaker curation, stage agendas, and gate check-in.
                </p>
              </button>

              {/* Domain 3: Partnerships & Ecosystem Relations */}
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleDomainSelect("partnerships_ecosystem")}
                className="flex flex-col text-left p-4 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-2.5">
                  <Handshake className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-[#C01E30]">
                  Partnerships &amp; Ecosystem
                </h4>
                <div className="text-[10px] font-mono text-[#C01E30] dark:text-[#E67C87] mt-0.5">
                  Outreach &amp; Sponsorships
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                  Corporate sponsorships, brand deliverable tracking, MoUs, and alumni founder connects.
                </p>
              </button>

              {/* Option 4: Decide Later / Unassigned */}
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleDomainSelect(null)}
                className="flex flex-col text-left p-4 rounded-xl border border-dashed border-border/70 bg-background/30 hover:border-border hover:bg-secondary/40 transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center mb-2.5">
                  <Clock className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-foreground">
                  Decide later / Unassigned
                </h4>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  Set in profile anytime
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                  Skip domain assignment for now. You or your lead can update this later in your profile.
                </p>
              </button>
            </div>
          </>
        ) : (
          /* Step 1: Organization Role Selection */
          <>
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

              {/* Option 2: Core Team -> triggers Step 2 */}
              <button
                type="button"
                onClick={() => setCoreTeamDomainStep(true)}
                className="flex flex-col text-left p-4 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-2.5">
                  <Users className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-[#C01E30]">
                  Core Team Member
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                  Active student coordinator in Research, Programs, or Partnerships.
                </p>
              </button>

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
          </>
        )}
      </div>
    </div>
  );
}

export default OnboardingDialog;
