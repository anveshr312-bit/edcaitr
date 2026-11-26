import type { Metadata } from 'next';
import { getPublicTeamProfiles } from '../../lib/events/events';
import { createPageMetadata } from '../../lib/seo';
import { BreadcrumbStructuredData } from '../../components/StructuredData';
import { AnchorsSection } from '../../components/team/AnchorsSection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: 'EDC Anchors — Directorate, Advisors & Core Team',
  description:
    'Meet the Director, faculty advisors, and student core team members anchoring the Entrepreneurship Development Cell at Acropolis Institute (AITR), Indore.',
  path: '/team',
  keywords: [
    'EDC Anchors',
    'EDC AITR leadership',
    'Acropolis E-Cell Director',
    'Faculty advisors AITR',
    'Student coordinators EDC Indore',
    'AIIH Foundation mentors',
  ],
});

export default async function TeamPage() {
  const currentTeam = await getPublicTeamProfiles();

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', path: '/' },
          { name: 'EDC Anchors', path: '/team' },
        ]}
      />

      {/* Header Band */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-10 lg:p-12 shadow-xs relative">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-border/80 bg-secondary/60 text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C01E30]" />
            EDC AITR · Institutional Leadership
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
            EDC Anchors
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            The executive directorate, academic advisors, and student operators who power the venture ecosystem, summit productions, and startup incubation at Acropolis Institute of Technology and Research.
          </p>
        </div>
      </section>

      {/* Roster Sections */}
      <AnchorsSection members={currentTeam} />
    </div>
  );
}
