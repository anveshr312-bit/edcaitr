import { NextResponse } from 'next/server';
import { createAdminClient, getUserContext, requireRole } from '../../../../lib/auth/authorization';

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'alumni');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const memberFilter = searchParams.get('member_type') ?? 'all'; // all | current | alumni
  const cityFilter = searchParams.get('city')?.trim().toLowerCase() ?? '';
  const industryFilter = searchParams.get('industry')?.trim().toLowerCase() ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from('org_memberships')
    .select(`
      user_id, role, effective_from,
      profiles!user_id(full_name, designation, bio, linkedin_url, avatar_ref, phone),
      alumni_profiles!user_id(batch_year, city, industry, domain, startup_stage, labels, show_in_directory, show_contact, allow_messages)
    `)
    .eq('status', 'approved')
    .in('role', ['director', 'advisor', 'core_team', 'alumni'])
    .is('effective_until', null);

  const seen = new Set<string>();
  const filtered = (memberships ?? [])
    .filter((m) => {
      if (seen.has(m.user_id)) return false;
      seen.add(m.user_id);

      const ap = Array.isArray(m.alumni_profiles) ? m.alumni_profiles[0] : m.alumni_profiles;
      if (ap && ap.show_in_directory === false) return false;

      if (memberFilter === 'alumni' && m.role !== 'alumni') return false;
      if (memberFilter === 'current' && m.role === 'alumni') return false;

      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      if (q) {
        const hay = `${p?.full_name ?? ''} ${p?.designation ?? ''} ${ap?.industry ?? ''} ${ap?.domain ?? ''} ${ap?.city ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cityFilter && !(ap?.city ?? '').toLowerCase().includes(cityFilter)) return false;
      if (industryFilter && !(ap?.industry ?? '').toLowerCase().includes(industryFilter)) return false;
      return true;
    })
    .map((m) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      const ap = Array.isArray(m.alumni_profiles) ? m.alumni_profiles[0] : m.alumni_profiles;
      const showContact = Boolean(ap?.show_contact);
      return {
        user_id: m.user_id,
        full_name: p?.full_name || 'EDC Member',
        designation: p?.designation ?? null,
        bio: p?.bio ?? null,
        avatar_ref: p?.avatar_ref ?? null,
        role: m.role,
        batch_year: ap?.batch_year ?? null,
        city: ap?.city ?? null,
        industry: ap?.industry ?? null,
        domain: ap?.domain ?? null,
        startup_stage: ap?.startup_stage ?? null,
        labels: ap?.labels ?? [],
        allow_messages: ap?.allow_messages ?? true,
        // Privacy-enforced fields
        linkedin_url: showContact ? (p?.linkedin_url ?? null) : null,
        phone: showContact ? (p?.phone ?? null) : null,
      };
    });

  const start = (page - 1) * PAGE_SIZE;
  return NextResponse.json({
    members: filtered.slice(start, start + PAGE_SIZE),
    total: filtered.length,
    page,
    page_size: PAGE_SIZE,
  });
}
