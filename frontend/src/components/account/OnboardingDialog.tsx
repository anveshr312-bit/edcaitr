"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Calendar,
  Handshake,
  Clock,
  ArrowLeft,
  X,
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
    // Only show to participants who explicitly indicated affiliation during sign in/up
    // and have not yet completed or dismissed the onboarding choice.
    if (role === "participant") {
      const requested = localStorage.getItem("edc_affiliation_requested");
      const answered = localStorage.getItem("edc_affiliation_answered");
      if (requested === "true" && !answered) {
        setShow(true);
      }
    }
  }, [role]);

  if (!show) return null;

  const handleDismiss = () => {
    localStorage.setItem("edc_affiliation_answered", "participant");
    localStorage.removeItem("edc_affiliation_requested");
    setShow(false);
  };

  const handleDomainSelect = async (domainValue: string | null) => {
    setSaving(true);
    try {
      localStorage.setItem("edc_affiliation_answered", "core_team");
      localStorage.removeItem("edc_affiliation_requested");
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
          /* Step 1: Organization Role Selection (Strictly 3 Options: Advisor, Core Team Member, Alumni) */
          <>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-medium border border-border/80 bg-secondary/60 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C01E30]" />
                EDC AITR Affiliation Onboarding
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Dismiss</span>
              </button>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Select your official EDC AITR role
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
                You indicated that you are part of EDC AITR. Please select your role to configure your verified profile and workspace access:
              </p>
            </div>

            {/* Exactly 3 Affiliation Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Option 1: Advisor */}
              <Link
                href="/account/apply?role=advisor"
                onClick={() => {
                  localStorage.setItem("edc_affiliation_answered", "advisor");
                  localStorage.removeItem("edc_affiliation_requested");
                }}
                className="flex flex-col justify-between text-left p-5 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-3">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-[#C01E30]">
                    Advisor
                  </h4>
                  <div className="text-[10px] font-mono text-[#C01E30] dark:text-[#E67C87] mt-0.5">
                    Advisory Board &amp; Guidance
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    Advisory board members, alumni entrepreneurs, and faculty mentors guiding institutional policy and ecosystem initiatives.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-border/30 text-xs font-semibold text-[#C01E30] inline-flex items-center gap-1">
                  <span>Complete advisor profile →</span>
                </div>
              </Link>

              {/* Option 2: Core Team Member */}
              <button
                type="button"
                onClick={() => setCoreTeamDomainStep(true)}
                className="flex flex-col justify-between text-left p-5 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group cursor-pointer"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-3">
                    <Users className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-[#C01E30]">
                    Core Team Member
                  </h4>
                  <div className="text-[10px] font-mono text-[#C01E30] dark:text-[#E67C87] mt-0.5">
                    Student Leadership &amp; Operations
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    Active student coordinators driving Research &amp; Digital, Programs &amp; Experiences, or Partnerships &amp; Ecosystem.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-border/30 text-xs font-semibold text-[#C01E30] inline-flex items-center gap-1">
                  <span>Select operational domain →</span>
                </div>
              </button>

              {/* Option 3: Alumni */}
              <Link
                href="/account/apply?role=alumni"
                onClick={() => {
                  localStorage.setItem("edc_affiliation_answered", "alumni");
                  localStorage.removeItem("edc_affiliation_requested");
                }}
                className="flex flex-col justify-between text-left p-5 rounded-xl border border-border/60 bg-background/50 hover:border-[#C01E30]/50 hover:bg-[#C01E30]/5 transition-all group"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center mb-3">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-[#C01E30]">
                    Alumni
                  </h4>
                  <div className="text-[10px] font-mono text-[#C01E30] dark:text-[#E67C87] mt-0.5">
                    Founder &amp; Industry Network
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    Former EDC AITR coordinators and student leaders who have graduated and are pursuing ventures or careers.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-border/30 text-xs font-semibold text-[#C01E30] inline-flex items-center gap-1">
                  <span>Join alumni network →</span>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OnboardingDialog;
