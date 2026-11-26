"use client";

import { useEffect } from "react";
import { X, Building, Award, UserCheck } from "lucide-react";
import { getImageKitUrl } from "../../lib/media/imagekit";

export interface ModalMemberProfile {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  designation?: string | null;
  company?: string | null;
  linkedinUrl?: string | null;
  tier?: "director" | "advisor" | "core_team" | "alumni";
}

interface Props {
  member: ModalMemberProfile | null;
  onClose: () => void;
}

export function MemberProfileModal({ member, onClose }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (member) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [member, onClose]);

  if (!member) return null;

  const photo = member.avatarUrl ? getImageKitUrl(member.avatarUrl) || member.avatarUrl : null;

  const roleLabel =
    member.tier === "director"
      ? "Director · Executive Leadership"
      : member.tier === "advisor"
      ? "Faculty & Strategic Advisor"
      : member.tier === "alumni"
      ? "Verified EDC Alumnus"
      : "Core Team Member";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={member.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-border/60 shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-secondary/80 border border-border/60 text-[#C01E30] font-bold text-2xl flex items-center justify-center flex-shrink-0">
              {member.name.charAt(0)}
            </div>
          )}

          <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-border/80 bg-secondary/60 text-muted-foreground">
              <UserCheck className="h-3 w-3 text-emerald-500" />
              {roleLabel}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
              {member.name}
            </h3>

            {member.company && (
              <p className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground font-medium">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{member.company}</span>
                {member.designation && <span>· {member.designation}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <div className="mt-6 pt-5 border-t border-border/40">
            <h4 className="text-xs font-semibold text-foreground/80 mb-2">
              About &amp; background
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {member.bio}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-5 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="h-4 w-4 text-[#C01E30]" />
            <span>EDC AITR Verified Profile</span>
          </div>

          {member.linkedinUrl && (
            <a
              href={member.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0077B5] hover:bg-[#006097] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              Connect on LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemberProfileModal;
