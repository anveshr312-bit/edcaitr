import { OPERATIONAL_TEAMS } from '../data/seedData';
import {
  Certificate,
  Conversation,
  EventItem,
  OpportunityListing,
  StartupListing,
  TaskItem,
  TeamAllocation,
  UserProfile,
} from '../types/portal';

export type CommandGroupId =
  | 'Quick Actions'
  | 'Navigation'
  | 'Events'
  | 'Workspace'
  | 'Alumni & Ventures'
  | 'Operational Teams';

export type CommandIconKey =
  | 'home'
  | 'calendar'
  | 'users'
  | 'info'
  | 'mail'
  | 'ticket'
  | 'award'
  | 'megaphone'
  | 'building'
  | 'rocket'
  | 'briefcase'
  | 'message'
  | 'dashboard'
  | 'qr'
  | 'kanban'
  | 'clipboard'
  | 'shield'
  | 'lock'
  | 'theme'
  | 'user';

export interface CommandItem {
  id: string;
  group: CommandGroupId;
  title: string;
  subtitle: string;
  href?: string;
  workspaceEventId?: string;
  actionType?: 'toggle-theme';
  icon: CommandIconKey;
  keywords: string[];
  aliases: string[];
  badge?: string;
  /** Priority boost for relevance ranking */
  priority?: number;
}

export interface CommandSearchScope {
  currentUser: UserProfile | null;
  events: EventItem[];
  users: UserProfile[];
  teamAllocations: TeamAllocation[];
  tasks: TaskItem[];
  certificates: Certificate[];
  startups: StartupListing[];
  opportunities: OpportunityListing[];
  conversations: Conversation[];
  activeWorkspaceEventId: string;
  isDark: boolean;
}

/**
 * Resolves the set of event IDs a staff member is authorized to operate on.
 * Mirrors backend/RLS event- and team-specific access rules rather than hiding UI blindly.
 */
export function getAuthorizedWorkspaceEventIds(
  user: UserProfile | null,
  events: EventItem[],
  teamAllocations: TeamAllocation[]
): Set<string> {
  const allowed = new Set<string>();
  if (!user) return allowed;

  if (user.role === 'director' || user.role === 'advisor') {
    events.forEach((evt) => allowed.add(evt.id));
    return allowed;
  }

  if (user.role === 'core_team') {
    events.forEach((evt) => {
      if (evt.spocPrimaryId === user.id || evt.spocSecondaryId === user.id) {
        allowed.add(evt.id);
      }
    });
    teamAllocations.forEach((alloc) => {
      if (alloc.leadId === user.id || alloc.memberIds.includes(user.id)) {
        allowed.add(alloc.eventId);
      }
    });
    // Core team members always retain read/work access to events matching their assigned team
    if (allowed.size === 0 && user.operationalTeam) {
      teamAllocations.forEach((alloc) => {
        if (alloc.teamCode === user.operationalTeam) {
          allowed.add(alloc.eventId);
        }
      });
    }
  }

  return allowed;
}

/**
 * Lightweight fuzzy subsequence + token scoring engine.
 * Returns 0 when query does not match; higher scores indicate stronger relevance.
 */
function scoreCandidate(query: string, item: CommandItem): number {
  const q = query.trim().toLowerCase();
  if (!q) return item.priority ?? 10;

  const title = item.title.toLowerCase();
  const subtitle = item.subtitle.toLowerCase();
  const aliases = item.aliases.map((a) => a.toLowerCase());
  const keywords = item.keywords.map((k) => k.toLowerCase());
  const haystack = `${title} ${subtitle} ${aliases.join(' ')} ${keywords.join(' ')}`;

  // Exact title or alias match
  if (title === q) return 120 + (item.priority ?? 0);
  if (aliases.includes(q)) return 110 + (item.priority ?? 0);

  // Prefix match on title or alias
  if (title.startsWith(q)) return 96 + (item.priority ?? 0);
  if (aliases.some((a) => a.startsWith(q))) return 88 + (item.priority ?? 0);

  // Multi-word token matching (all space-separated tokens must match somewhere)
  const tokens = q.split(/\s+/).filter(Boolean);
  let totalScore = 0;

  for (const token of tokens) {
    if (title.includes(token)) {
      const boundary = new RegExp(`(^|\\s|[-/·])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      totalScore += boundary.test(title) ? 42 : 32;
    } else if (aliases.some((a) => a.includes(token))) {
      totalScore += 34;
    } else if (keywords.some((k) => k.includes(token))) {
      totalScore += 24;
    } else if (subtitle.includes(token)) {
      totalScore += 18;
    } else {
      // Ordered fuzzy subsequence check against title + aliases
      const fuzzyTargets = [title, ...aliases];
      let bestFuzzy = 0;
      for (const target of fuzzyTargets) {
        let ti = 0;
        let consecutive = 0;
        let maxConsecutive = 0;
        for (let i = 0; i < target.length && ti < token.length; i++) {
          if (target[i] === token[ti]) {
            ti++;
            consecutive++;
            if (consecutive > maxConsecutive) maxConsecutive = consecutive;
          } else {
            consecutive = 0;
          }
        }
        if (ti === token.length) {
          const density = token.length / Math.max(target.length, 1);
          const candidateScore = 10 + maxConsecutive * 3 + Math.round(density * 8);
          if (candidateScore > bestFuzzy) bestFuzzy = candidateScore;
        }
      }
      if (bestFuzzy === 0 && !haystack.includes(token)) {
        return 0;
      }
      totalScore += bestFuzzy;
    }
  }

  return totalScore + (item.priority ?? 0);
}

/**
 * Builds the permission-scoped catalog of searchable entities for the active session.
 * Restricted records are never materialized into the search catalog for unauthorized callers.
 */
export function buildScopedCommandCatalog(scope: CommandSearchScope): CommandItem[] {
  const {
    currentUser,
    events,
    users,
    teamAllocations,
    tasks,
    certificates,
    startups,
    opportunities,
    conversations,
    activeWorkspaceEventId,
    isDark,
  } = scope;

  const isAuthenticated = Boolean(currentUser);
  const isStaff =
    currentUser?.role === 'core_team' ||
    currentUser?.role === 'advisor' ||
    currentUser?.role === 'director';
  const isGovernanceLead =
    currentUser?.role === 'advisor' || currentUser?.role === 'director';

  const items: CommandItem[] = [];

  // 1. Public Navigation & Utility Actions (always permitted)
  items.push(
    {
      id: 'nav-home',
      group: 'Navigation',
      title: 'EDC AITR Home',
      subtitle: 'Flagship initiatives, impact metrics & partner ecosystem',
      href: '/',
      icon: 'home',
      keywords: ['landing', 'showcase', 'acropolis', 'indore', 'overview'],
      aliases: ['home', 'start', 'index'],
      priority: 12,
    },
    {
      id: 'nav-events',
      group: 'Navigation',
      title: 'Events & Registration',
      subtitle: 'Browse conclaves, hackathons, bootcamps & digital passes',
      href: '/events',
      icon: 'calendar',
      keywords: ['conclaves', 'hackathons', 'bootcamps', 'register', 'passes'],
      aliases: ['events', 'summit', 'tickets', 'register'],
      priority: 14,
    },
    {
      id: 'nav-about',
      group: 'Navigation',
      title: 'About EDC AITR & AIIH',
      subtitle: 'Institutional charter, incubation partnership & leadership mandate',
      href: '/about',
      icon: 'info',
      keywords: ['mission', 'aiih', 'incubation', 'charter', 'acropolis'],
      aliases: ['about', 'charter', 'mission'],
      priority: 8,
    },
    {
      id: 'nav-team',
      group: 'Navigation',
      title: 'Executive Board & 12 Teams',
      subtitle: 'Faculty advisors, student leadership & operational divisions',
      href: '/team',
      icon: 'users',
      keywords: ['leadership', 'board', 'divisions', 'members', 'faculty'],
      aliases: ['team', 'org', 'board', 'divisions'],
      priority: 9,
    },
    {
      id: 'nav-contact',
      group: 'Navigation',
      title: 'Contact & Partnerships',
      subtitle: 'General inquiries, startup incubation & conclave sponsorships',
      href: '/contact',
      icon: 'mail',
      keywords: ['sponsor', 'partnership', 'support', 'inquiry', 'email'],
      aliases: ['contact', 'help', 'sponsor'],
      priority: 7,
    },
    {
      id: 'action-theme',
      group: 'Quick Actions',
      title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle EDC AITR obsidian / paper visual theme',
      actionType: 'toggle-theme',
      icon: 'theme',
      keywords: ['appearance', 'contrast', 'color', 'night', 'day'],
      aliases: ['theme', 'dark', 'light', 'mode'],
      priority: 6,
    }
  );

  if (!isAuthenticated) {
    items.push(
      {
        id: 'nav-signin',
        group: 'Quick Actions',
        title: 'Sign In to Portal',
        subtitle: 'Access tickets, verified certificates, Alumni Connect or Workspace',
        href: '/account',
        icon: 'user',
        keywords: ['login', 'account', 'demo', 'auth'],
        aliases: ['signin', 'login', 'auth', 'portal'],
        priority: 16,
      },
      {
        id: 'nav-apply-member',
        group: 'Navigation',
        title: 'Apply for EDC Core Team',
        subtitle: 'Submit student membership application across 12 teams',
        href: '/account/apply',
        icon: 'clipboard',
        keywords: ['recruitment', 'join', 'membership', 'volunteer'],
        aliases: ['apply', 'join', 'recruit'],
        priority: 7,
      }
    );
  }

  // 2. Published Public Events (always permitted)
  events
    .filter((evt) => evt.status === 'Published' || isStaff)
    .forEach((evt) => {
      items.push({
        id: `evt-public-${evt.id}`,
        group: 'Events',
        title: evt.title,
        subtitle: `${evt.category} · ${evt.dateLabel} · ${evt.venue}`,
        href: `/events/${evt.slug}`,
        icon: 'calendar',
        keywords: [evt.category, evt.venue, evt.subtitle, evt.status],
        aliases: [evt.slug, evt.category.toLowerCase()],
        badge: evt.status === 'Closed' ? 'Archived' : evt.isPaid ? `₹${evt.feeInr}` : 'Free',
        priority: 11,
      });
    });

  // 3. Public 12 Operational Teams overview
  OPERATIONAL_TEAMS.forEach((team) => {
    items.push({
      id: `team-div-${team.code}`,
      group: 'Operational Teams',
      title: `${team.code} — ${team.name}`,
      subtitle: team.mandate,
      href: '/team',
      icon: 'users',
      keywords: [team.code, team.name, team.mandate],
      aliases: [team.code.toLowerCase()],
      badge: team.code,
      priority: 4,
    });
  });

  // 4. Authenticated Participant & Alumni Scope
  if (isAuthenticated && currentUser) {
    items.push(
      {
        id: 'portal-dashboard',
        group: 'Quick Actions',
        title: 'Participant Dashboard & Digital Passes',
        subtitle: 'View QR tickets, payment verification & upcoming registrations',
        href: '/portal',
        icon: 'ticket',
        keywords: ['passes', 'tickets', 'registrations', 'qr', 'my events'],
        aliases: ['portal', 'passes', 'tickets', 'dashboard'],
        priority: 15,
      },
      {
        id: 'portal-announcements',
        group: 'Navigation',
        title: 'Official Announcements',
        subtitle: 'Campus conclave notices & downloadable delegate handbooks',
        href: '/portal/announcements',
        icon: 'megaphone',
        keywords: ['notices', 'updates', 'handbook', 'bulletin'],
        aliases: ['announcements', 'news', 'notices'],
        priority: 9,
      },
      {
        id: 'portal-certificates',
        group: 'Quick Actions',
        title: 'My Verified Certificates',
        subtitle: 'Download cryptographically cataloged EDC AITR credentials (PDF)',
        href: '/portal/certificates',
        icon: 'award',
        keywords: ['credentials', 'pdf', 'winner', 'organizer', 'diploma'],
        aliases: ['cert', 'certs', 'certificates', 'pdf'],
        priority: 13,
      },
      {
        id: 'alumni-directory',
        group: 'Alumni & Ventures',
        title: 'Verified Alumni Directory',
        subtitle: 'Connect with EDC founders, mentors & past office bearers',
        href: '/alumni/directory',
        icon: 'building',
        keywords: ['mentors', 'network', 'founders', 'batches'],
        aliases: ['alumni', 'directory', 'network'],
        priority: 12,
      },
      {
        id: 'alumni-startups',
        group: 'Alumni & Ventures',
        title: 'Startup Showcase',
        subtitle: 'Explore campus & alumni ventures incubated through EDC AITR',
        href: '/alumni/startups',
        icon: 'rocket',
        keywords: ['ventures', 'fintech', 'edtech', 'saas', 'pitch', 'founders'],
        aliases: ['startups', 'ventures', 'pitch'],
        priority: 11,
      },
      {
        id: 'alumni-opportunities',
        group: 'Alumni & Ventures',
        title: 'Opportunities & Co-Founder Board',
        subtitle: 'Internships, full-time roles & co-founder equity listings',
        href: '/alumni/opportunities',
        icon: 'briefcase',
        keywords: ['hiring', 'internships', 'jobs', 'cofounder', 'referrals'],
        aliases: ['jobs', 'intern', 'opportunities', 'cofounder'],
        priority: 10,
      },
      {
        id: 'alumni-messages',
        group: 'Alumni & Ventures',
        title: 'Alumni In-App Messaging',
        subtitle: 'Private mentorship threads & direct member inbox',
        href: '/alumni/messages',
        icon: 'message',
        keywords: ['chat', 'inbox', 'dm', 'mentorship'],
        aliases: ['messages', 'inbox', 'chat', 'dm'],
        priority: 11,
      }
    );

    // Own verified certificates only (strict userId scope)
    certificates
      .filter((cert) => cert.userId === currentUser.id)
      .forEach((cert) => {
        items.push({
          id: `cert-own-${cert.id}`,
          group: 'Quick Actions',
          title: `Certificate · ${cert.eventName}`,
          subtitle: `${cert.role} · ${cert.credentialCode}`,
          href: '/portal/certificates',
          icon: 'award',
          keywords: [cert.eventName, cert.credentialCode, cert.role],
          aliases: ['cert', cert.credentialCode.toLowerCase()],
          badge: cert.role,
          priority: 8,
        });
      });

    // Verified Alumni & Member Directory entries (authenticated members only)
    users
      .filter((u) => u.role === 'alumni' || u.tenure === 'past')
      .forEach((alum) => {
        items.push({
          id: `alum-user-${alum.id}`,
          group: 'Alumni & Ventures',
          title: alum.name,
          subtitle: `${alum.designation}${alum.company ? ` · ${alum.company}` : ''} · Batch ${alum.batch}`,
          href: '/alumni/directory',
          icon: 'user',
          keywords: [alum.city, alum.industry, alum.company ?? '', alum.batch, alum.pastEdcRole ?? ''],
          aliases: [alum.name.toLowerCase()],
          badge: `Batch ${alum.batch}`,
          priority: 6,
        });
      });

    // Startups (authenticated Alumni Connect scope)
    startups.forEach((stp) => {
      items.push({
        id: `startup-${stp.id}`,
        group: 'Alumni & Ventures',
        title: stp.name,
        subtitle: `${stp.industry} · ${stp.fundingStage} · ${stp.tagline}`,
        href: '/alumni/startups',
        icon: 'rocket',
        keywords: [stp.founderName, stp.industry, stp.city, stp.fundingStage, stp.tagline],
        aliases: [stp.name.toLowerCase()],
        badge: stp.industry,
        priority: 7,
      });
    });

    // Opportunities (authenticated Alumni Connect scope)
    opportunities.forEach((opp) => {
      items.push({
        id: `opp-${opp.id}`,
        group: 'Alumni & Ventures',
        title: `${opp.title} · ${opp.company}`,
        subtitle: `${opp.type} · ${opp.location} · ${opp.compensation}`,
        href: '/alumni/opportunities',
        icon: 'briefcase',
        keywords: [opp.company, opp.type, opp.location, opp.postedBy],
        aliases: ['job', 'intern', opp.company.toLowerCase()],
        badge: opp.type,
        priority: 6,
      });
    });

    // Private conversations strictly scoped to conversations involving currentUser
    conversations
      .filter(
        (conv) =>
          conv.participantIds.includes(currentUser.id) ||
          (currentUser.role === 'participant' && conv.participantIds.includes('usr-student'))
      )
      .forEach((conv) => {
        items.push({
          id: `conv-${conv.id}`,
          group: 'Alumni & Ventures',
          title: `Thread with ${conv.peerName}`,
          subtitle: `${conv.peerRole} · ${conv.peerCompany}`,
          href: `/alumni/messages?thread=${conv.id}`,
          icon: 'message',
          keywords: [conv.peerName, conv.peerCompany, 'chat', 'message'],
          aliases: ['dm', conv.peerName.toLowerCase()],
          badge: conv.status === 'pending_request' ? 'Request' : 'Active',
          priority: 7,
        });
      });
  }

  // 5. Authorized Staff Workspace Scope (event- & team-scoped)
  if (isStaff && currentUser) {
    const allowedEventIds = getAuthorizedWorkspaceEventIds(
      currentUser,
      events,
      teamAllocations
    );
    const activeEvt =
      events.find((e) => e.id === activeWorkspaceEventId && allowedEventIds.has(e.id)) ??
      events.find((e) => allowedEventIds.has(e.id));

    items.push({
      id: 'ws-command-center',
      group: 'Workspace',
      title: 'Workspace Command Center',
      subtitle: 'Event operations telemetry, deadlines & active readiness overview',
      href: '/workspace',
      icon: 'dashboard',
      keywords: ['operations', 'staff', 'command', 'workspace'],
      aliases: ['ws', 'workspace', 'ops'],
      priority: 16,
    });

    if (activeEvt) {
      items.push(
        {
          id: `ws-checkin-${activeEvt.id}`,
          group: 'Workspace',
          title: `RD QR Check-in Console · ${activeEvt.title}`,
          subtitle: 'Validate attendee digital passes and monitor gate throughput',
          href: `/workspace/events/${activeEvt.id}/checkin`,
          workspaceEventId: activeEvt.id,
          icon: 'qr',
          keywords: ['gate', 'scanner', 'attendance', 'rd', 'ticket'],
          aliases: ['qr', 'gate', 'checkin', 'scan'],
          badge: 'RD Desk',
          priority: 15,
        },
        {
          id: `ws-tasks-${activeEvt.id}`,
          group: 'Workspace',
          title: `Task Management Board · ${activeEvt.title}`,
          subtitle: 'Kanban deliverable reviews across operational teams',
          href: `/workspace/events/${activeEvt.id}/tasks`,
          workspaceEventId: activeEvt.id,
          icon: 'kanban',
          keywords: ['kanban', 'deliverables', 'todo', 'approvals'],
          aliases: ['tasks', 'kanban', 'board'],
          priority: 13,
        },
        {
          id: `ws-teams-${activeEvt.id}`,
          group: 'Workspace',
          title: `12-Team Roster · ${activeEvt.title}`,
          subtitle: 'Assign leads and student volunteers across all 12 divisions',
          href: `/workspace/events/${activeEvt.id}/teams`,
          workspaceEventId: activeEvt.id,
          icon: 'users',
          keywords: ['roster', 'allocations', 'volunteers', 'leads'],
          aliases: ['roster', 'allocations', 'teams'],
          priority: 11,
        },
        {
          id: `ws-regs-${activeEvt.id}`,
          group: 'Workspace',
          title: `Registrations & UTR Exports · ${activeEvt.title}`,
          subtitle: 'Verify UPI UTR payments and export attendee CSV ledgers',
          href: `/workspace/events/${activeEvt.id}/registrations`,
          workspaceEventId: activeEvt.id,
          icon: 'clipboard',
          keywords: ['utr', 'payments', 'csv', 'export', 'attendees'],
          aliases: ['utr', 'csv', 'registrations', 'payments'],
          priority: 12,
        },
        {
          id: `ws-closure-${activeEvt.id}`,
          group: 'Workspace',
          title: `Closure & Permanent Archive · ${activeEvt.title}`,
          subtitle: 'Finalize compliance checklist, issue certificates & lock record',
          href: `/workspace/events/${activeEvt.id}/closure`,
          workspaceEventId: activeEvt.id,
          icon: 'lock',
          keywords: ['archive', 'lock', 'compliance', 'audit', 'certificates'],
          aliases: ['closure', 'lock', 'archive'],
          priority: 10,
        },
        {
          id: `ws-builder-${activeEvt.id}`,
          group: 'Workspace',
          title: `Event Builder · ${activeEvt.title}`,
          subtitle: 'Configure event schedule, speakers, capacity & UPI fee details',
          href: `/workspace/events/${activeEvt.id}`,
          workspaceEventId: activeEvt.id,
          icon: 'calendar',
          keywords: ['edit', 'builder', 'speakers', 'schedule'],
          aliases: ['builder', 'edit event'],
          priority: 10,
        }
      );
    }

    // Event- & team-scoped task items (Core Team sees only tasks in authorized events/team)
    tasks
      .filter((t) => {
        if (!allowedEventIds.has(t.eventId)) return false;
        if (isGovernanceLead) return true;
        return (
          t.assigneeId === currentUser.id ||
          (currentUser.operationalTeam && t.teamCode === currentUser.operationalTeam)
        );
      })
      .slice(0, 12)
      .forEach((task) => {
        items.push({
          id: `ws-task-item-${task.id}`,
          group: 'Workspace',
          title: task.title,
          subtitle: `${task.teamCode} · ${task.status} · Due ${task.deadline}`,
          href: `/workspace/events/${task.eventId}/tasks`,
          workspaceEventId: task.eventId,
          icon: 'kanban',
          keywords: [task.teamCode, task.status, task.brief],
          aliases: ['task', task.teamCode.toLowerCase()],
          badge: task.status,
          priority: 5,
        });
      });

    // Governance tools strictly scoped to Staff / Directors
    items.push(
      {
        id: 'gov-applications',
        group: 'Workspace',
        title: 'Membership Application Reviews',
        subtitle: 'Evaluate student recruitment portfolios & team preferences',
        href: '/account/applications',
        icon: 'clipboard',
        keywords: ['recruitment', 'candidates', 'review', 'approve'],
        aliases: ['applications', 'reviews', 'recruitment'],
        priority: 10,
      },
      {
        id: 'gov-mfa',
        group: 'Workspace',
        title: 'Governance Security & 2FA (TOTP)',
        subtitle: 'Manage director authenticator security & MFA status',
        href: '/account/mfa',
        icon: 'shield',
        keywords: ['security', 'authenticator', 'totp', 'director'],
        aliases: ['2fa', 'mfa', 'totp', 'security'],
        priority: 9,
      }
    );

    if (isGovernanceLead) {
      items.push({
        id: 'ws-new-event',
        group: 'Workspace',
        title: 'Create New Event',
        subtitle: 'Launch a new conclave, hackathon, or bootcamp in Event Builder',
        href: '/workspace/events/new',
        icon: 'calendar',
        keywords: ['create', 'new', 'launch', 'draft'],
        aliases: ['new event', 'create event'],
        priority: 11,
      });
    }
  }

  return items;
}

export interface CommandSearchResult {
  items: CommandItem[];
  groups: { group: CommandGroupId; items: CommandItem[] }[];
  totalCount: number;
}

const GROUP_ORDER: CommandGroupId[] = [
  'Quick Actions',
  'Workspace',
  'Events',
  'Alumni & Ventures',
  'Navigation',
  'Operational Teams',
];

export function searchPortalEntities(
  query: string,
  scope: CommandSearchScope
): CommandSearchResult {
  const catalog = buildScopedCommandCatalog(scope);
  const trimmed = query.trim();

  let ranked: CommandItem[];
  if (!trimmed) {
    // Curated high-utility suggestions when search input is empty
    ranked = catalog
      .filter((item) => (item.priority ?? 0) >= 10)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, 10);
  } else {
    ranked = catalog
      .map((item) => ({ item, score: scoreCandidate(trimmed, item) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 18)
      .map((entry) => entry.item);
  }

  const groupMap = new Map<CommandGroupId, CommandItem[]>();
  for (const item of ranked) {
    const list = groupMap.get(item.group) ?? [];
    list.push(item);
    groupMap.set(item.group, list);
  }

  const groups = GROUP_ORDER.filter((g) => groupMap.has(g)).map((g) => ({
    group: g,
    items: groupMap.get(g)!,
  }));

  return {
    items: groups.flatMap((g) => g.items),
    groups,
    totalCount: ranked.length,
  };
}
