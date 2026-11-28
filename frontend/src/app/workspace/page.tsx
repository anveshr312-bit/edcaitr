import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  Handshake,
  Sparkles,
  FileText,
  Award,
  Ticket,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  Radio,
  Users,
} from 'lucide-react';
import { createClient } from '../../lib/supabase/server';
import { getUserRole } from '../../lib/auth/authorization';

export const dynamic = 'force-dynamic';

const DOMAIN_DETAILS: Record<
  string,
  { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }
> = {
  research_digital: {
    title: 'Research & Digital Communications',
    subtitle: 'Knowledge, Content & Entrepreneurship Education',
    icon: BookOpen,
  },
  programs_experiences: {
    title: 'Programs & Experiences',
    subtitle: 'Event Design, Interventions & Learning Outcomes',
    icon: Calendar,
  },
  partnerships_ecosystem: {
    title: 'Partnerships & Ecosystem Relations',
    subtitle: 'Sponsorships, Resource Mobilization & Outreach',
    icon: Handshake,
  },
};

export default async function WorkspaceHomePage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (!['core_team', 'advisor', 'director'].includes(role)) {
    redirect('/account/dashboard');
  }

  // Mandatory Director MFA check
  if (role === 'director') {
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (mfaData?.currentLevel !== 'aal2') {
      redirect('/account/mfa?required=1');
    }
  }

  const [{ data: myTeams }, { data: myTasks }, { data: events }, { data: profile }] = await Promise.all([
    supabase
      .from('event_team_members')
      .select('id, event_id, team_code, is_coordinator, operational_teams(name), events(id, title, starts_at)')
      .eq('user_id', user.id),
    supabase
      .from('tasks')
      .select('id, event_id, team_code, title, status, blocker_note, due_at, events(title)')
      .order('due_at', { ascending: true, nullsFirst: false }),
    supabase
      .from('events')
      .select('id, title, status, starts_at')
      .order('starts_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('profiles')
      .select('full_name, domain')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  const openTasks = (myTasks ?? []).filter((t) => t.status !== 'approved');
  const blockedTasks = openTasks.filter(t => t.blocker_note);

  return (
    <>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            Workspace · {role === 'core_team' && profile?.domain ? DOMAIN_DETAILS[profile.domain]?.title : role.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
              My Event Work
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 540, lineHeight: 1.6 }}>
              Assigned operational teams, active tasks, and accessible event workspaces.
            </p>
          </div>
          <Link href="/workspace/events" className="btn btn-primary" style={{ fontSize: 13 }}>
            Event Management →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 16, marginTop: 24 }}>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{(myTeams ?? []).length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Team Assignments</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: openTasks.length > 0 ? 'var(--color-3-accent-personality)' : 'var(--success)' }}>{openTasks.length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Open Tasks</div>
        </div>
        {blockedTasks.length > 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '18px 12px', borderLeft: '3px solid var(--danger)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{blockedTasks.length}</div>
            <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Blocked</div>
          </div>
        )}
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{(events ?? []).length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Total Events</div>
        </div>
      </div>

      {/* ── CORE TEAM DOMAIN-SPECIFIC OPERATIONAL CONSOLE ── */}
      {role === 'core_team' && (
        <section style={{ marginTop: 36 }}>
          {profile?.domain === 'research_digital' ? (
            /* Domain 1: Research & Digital Communications Desk */
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-tint)', color: 'var(--color-3-accent-personality)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Research &amp; Digital Communications Desk
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Knowledge generation, startup case studies, policy research, and editorial calendars.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 18 }}>
                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <FileText style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Case Studies &amp; Teardowns</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Draft teardowns of startup business models, founder decisions, and market trends for the EDC knowledge archive.
                  </p>
                  <Link href="/workspace/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Knowledge CMS →
                  </Link>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <TrendingUp style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Grant &amp; Opportunity Radar</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Track active government funding windows (DPIIT Seed Fund, MP Startup Policy, NIDHI-EIR, SISFS) for campus founders.
                  </p>
                  <Link href="/workspace/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Grant Tracker →
                  </Link>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <Calendar style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Editorial Publishing Queue</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Coordinate social media calendar, Instagram carousels, founder spotlights, and monthly digital newsletters.
                  </p>
                  <Link href="/workspace/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Editorial Queue →
                  </Link>
                </div>
              </div>
            </div>
          ) : profile?.domain === 'programs_experiences' ? (
            /* Domain 2: Programs & Experiences Production Deck */
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-tint)', color: 'var(--color-3-accent-personality)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Programs &amp; Experiences Production Deck
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Event design, speaker curation, stage agendas, and live gate check-in.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <Calendar style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Master Event Calendar</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Schedule upcoming dates, monitor readiness % (0-100), update milestones, and manage public notices.
                  </p>
                  <Link href="/workspace/calendar" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Open Event Calendar →
                  </Link>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <Sparkles style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Run-of-Show &amp; Agendas</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Plan minute-by-minute timelines, audio/visual cues, speaker tech checks, and stage coordinator rosters.
                  </p>
                  <Link href="/workspace/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Stage Timelines →
                  </Link>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <Users style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Speaker &amp; Jury Bureau</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Manage speaker shortlists, invitation letters, travel coordination, and pitch jury panel confirmations.
                  </p>
                  <Link href="/workspace/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Speaker Bureau →
                  </Link>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <CheckCircle2 style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Live Gate &amp; Check-in</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Monitor real-time attendee admissions, verify QR registrations, and oversee accreditation check-in.
                  </p>
                  <Link href="/workspace/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Gate Admissions →
                  </Link>
                </div>
              </div>
            </div>
          ) : profile?.domain === 'partnerships_ecosystem' ? (
            /* Domain 3: Partnerships & Ecosystem Deal Room */
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-tint)', color: 'var(--color-3-accent-personality)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Handshake style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Partnerships &amp; Ecosystem Deal Room
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Corporate sponsorships, MoUs, brand deliverables, and ecosystem outreach.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 18 }}>
                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <Award style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Sponsorship CRM</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Track corporate sponsor prospects across Title, Co-Presenting, Powered By, In-kind, and Prize partnership tiers.
                  </p>
                  <Link href="/workspace/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Sponsor Pipeline →
                  </Link>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <CheckCircle2 style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Deliverables Fulfillment</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Track branding obligations: logo presence on banners, booth space allocation, stall setup, and VIP lounge access.
                  </p>
                  <Link href="/workspace/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Deliverable Matrix →
                  </Link>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--color-3-accent-personality)' }}>
                    <ShieldCheck style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>MoU &amp; Partner Vault</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Manage signed institutional collaboration agreements with TiE MP, Headstart, AIIH Foundation, and IIC hubs.
                  </p>
                  <Link href="/workspace/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-3-accent-personality)', textDecoration: 'none' }}>
                    Partner Vault →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Unassigned Domain Prompt */
            <div className="card" style={{ background: 'var(--surface)', border: '1px dashed var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-subtle)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HelpCircle style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Select Your Core Team Operating Domain
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: 520, lineHeight: 1.5 }}>
                      Under the EDC AITR team structure, every core member operates within one of three pillars: <strong>Research &amp; Digital</strong>, <strong>Programs &amp; Experiences</strong>, or <strong>Partnerships &amp; Ecosystem</strong>.
                    </p>
                  </div>
                </div>

                <Link
                  href="/account/profile"
                  className="btn btn-primary"
                  style={{ fontSize: 13, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Choose Domain in Profile</span>
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── LEADERSHIP EXECUTIVE CONSOLE (For Director & Advisor) ── */}
      {(role === 'director' || role === 'advisor') && (
        <section style={{ marginTop: 36 }}>
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-tint)', color: 'var(--color-3-accent-personality)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Executive Governance &amp; Domain Oversight
                </h2>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Institutional monitoring across all three operational pillars of the EDC AITR student team.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <BookOpen style={{ width: 14, height: 14, color: 'var(--color-3-accent-personality)' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Research &amp; Digital</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Case studies, founder teardowns, policy playbooks, and content publishing cadence.
                </p>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Calendar style={{ width: 14, height: 14, color: 'var(--color-3-accent-personality)' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Programs &amp; Experiences</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Interventions, hackathons, speaker briefings, gate verification, and feedback audits.
                </p>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Handshake style={{ width: 14, height: 14, color: 'var(--color-3-accent-personality)' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Partnerships &amp; Ecosystem</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Corporate sponsorships, brand deliverables, institutional MoUs, and alumni network.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Assigned teams */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 16px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
          Assigned Operational Teams
        </h2>
        {!myTeams || myTeams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <p className="card-meta" style={{ margin: 0 }}>No team assignments yet. Contact your Advisor or Event Lead to be assigned.</p>
          </div>
        ) : (
          <div className="grid">
            {myTeams.map((m) => {
              const ev = Array.isArray(m.events) ? m.events[0] : m.events;
              const team = Array.isArray(m.operational_teams) ? m.operational_teams[0] : m.operational_teams;
              return (
                <article key={m.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-accent">{team?.name ?? m.team_code}</span>
                    {m.is_coordinator && <span className="badge">Coordinator</span>}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{ev?.title ?? 'Event'}</h3>
                  {ev?.starts_at && <p className="mono-meta" style={{ margin: 0 }}>{new Date(ev.starts_at).toLocaleDateString('en-IN')}</p>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 10 }}>
                    <Link href={`/workspace/events/${m.event_id}/tasks`} style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>Tasks →</Link>
                    <Link href={`/workspace/events/${m.event_id}/teams`} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Team →</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Open tasks */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 16px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
          Open Tasks ({openTasks.length})
        </h2>
        {openTasks.length === 0 ? (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="card-meta" style={{ margin: 0 }}>All caught up — no open tasks.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {openTasks.map((task) => {
              const ev = Array.isArray(task.events) ? task.events[0] : task.events;
              const isBlocked = Boolean(task.blocker_note);
              return (
                <div key={task.id} className="card" style={{ padding: '14px 18px', borderLeft: isBlocked ? '3px solid var(--danger)' : undefined, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isBlocked ? 'var(--danger)' : 'var(--accent-ink)' }}>{task.status.replace('_', ' ')}</span>
                      <span className="mono-meta">{task.team_code}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{task.title}</div>
                    <div className="card-meta" style={{ margin: 0, fontSize: 13 }}>{ev?.title ?? 'Event'}</div>
                    {task.blocker_note && (
                      <div style={{ marginTop: 6, fontSize: 13, color: 'var(--danger)', fontStyle: 'italic' }}>
                        Blocked: {task.blocker_note}
                      </div>
                    )}
                  </div>
                  <Link href={`/workspace/events/${task.event_id}/tasks`} style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Task board →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
