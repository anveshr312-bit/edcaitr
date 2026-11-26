"use client";

import { useState } from "react";
import { TeamRevealGrid, type TeamRevealMember } from "../ui/TeamRevealGrid";
import { MemberProfileModal, type ModalMemberProfile } from "../ui/MemberProfileModal";
import type { PublicTeamMember } from "../../lib/events/events";
import { getImageKitUrl } from "../../lib/media/imagekit";

interface Props {
  members: PublicTeamMember[];
}

export function AnchorsSection({ members }: Props) {
  const [selectedProfile, setSelectedProfile] = useState<ModalMemberProfile | null>(null);

  // Group members into Directorate, Advisors, Core Team
  const directorMembers = members.filter((m) => m.role === "director");
  const advisorMembers = members.filter((m) => m.role === "advisor");
  const coreTeamMembers = members.filter((m) => m.role === "core_team");

  const mapToReveal = (m: PublicTeamMember, isStudent = false): TeamRevealMember => {
    const imgUrl = m.avatar_ref ? getImageKitUrl(m.avatar_ref) || m.avatar_ref : undefined;
    return {
      id: m.id,
      name: m.full_name,
      // Rule: Students are not divided by operational roles. No operational tag beneath their name.
      role: isStudent ? "" : (m.role === "director" ? "Director" : "Faculty Advisor"),
      expertise: m.bio || (isStudent ? "Core Team Member · Student Leader" : "Strategic & Institutional Leadership"),
      bio: m.bio || undefined,
      image: imgUrl,
      accent: "#C01E30",
      linkedinUrl: m.linkedin_url || undefined,
      tier: m.role,
    };
  };

  const handleMemberClick = (revealMember: TeamRevealMember) => {
    setSelectedProfile({
      id: revealMember.id,
      name: revealMember.name,
      role: revealMember.role,
      avatarUrl: revealMember.image,
      bio: revealMember.bio,
      linkedinUrl: revealMember.linkedinUrl,
      tier: revealMember.tier,
    });
  };

  return (
    <div className="space-y-16">
      {/* Directorate & Leadership */}
      {directorMembers.length > 0 && (
        <div>
          <TeamRevealGrid
            eyebrow="Executive Directorate"
            title="Directorate"
            description="Institutional oversight, governance, and foundational leadership of the Entrepreneurship Development Cell."
            members={directorMembers.map((m) => mapToReveal(m, false))}
            onMemberClick={handleMemberClick}
          />
        </div>
      )}

      {/* Advisory Council */}
      {advisorMembers.length > 0 && (
        <div>
          <TeamRevealGrid
            eyebrow="Strategic Advisory Council"
            title="Faculty Advisors"
            description="Distinguished professors, institutional mentors, and incubation advisors guiding student venture builders."
            members={advisorMembers.map((m) => mapToReveal(m, false))}
            onMemberClick={handleMemberClick}
          />
        </div>
      )}

      {/* Core Team (Students - Name Only, No Operational Subtitles) */}
      {coreTeamMembers.length > 0 && (
        <div>
          <TeamRevealGrid
            eyebrow="Student Leadership & Execution"
            title="Core Team"
            description="The selected student coordinators steering summit production, ecosystem outreach, and campus venture initiatives."
            members={coreTeamMembers.map((m) => mapToReveal(m, true))}
            onMemberClick={handleMemberClick}
          />
        </div>
      )}

      {/* Profile Detail Modal */}
      <MemberProfileModal
        member={selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />
    </div>
  );
}

export default AnchorsSection;
