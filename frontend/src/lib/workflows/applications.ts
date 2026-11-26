/**
 * Application workflow server actions.
 * All functions are server-side only (import only from server components or route handlers).
 * Multi-step mutations execute atomically via PostgreSQL RPC functions.
 */
import {
  createAdminClient,
  createSessionClient,
  getUserContext,
  requireDirectorMfa,
  requireRole,
} from '../auth/authorization';
import { sendApplicationDecisionEmail, sendApplicationReceivedEmail } from '../applications/email';

export type ApplicationType =
  | 'advisor_application'
  | 'core_team_application'
  | 'alumni_verification'
  | 'promotion_nomination';

// ---------------------------------------------------------------------------
// Submit an application (self-service by participant / core_team / advisor)
// ---------------------------------------------------------------------------

export async function submitApplication(
  applicationType: 'advisor_application' | 'core_team_application' | 'alumni_verification',
  statement: string
): Promise<{ ok: boolean; error?: string; applicationId?: string }> {
  const ctx = await getUserContext();
  if (!ctx) return { ok: false, error: 'Authentication required.' };

  const client = await createSessionClient();
  if (!client) return { ok: false, error: 'Service unavailable.' };

  const { data: existing } = await client
    .from('applications')
    .select('id')
    .eq('applicant_id', ctx.id)
    .eq('application_type', applicationType)
    .is('reviewed_at', null)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: 'You already have a pending application of this type.' };
  }

  const { data, error } = await client
    .from('applications')
    .insert({
      applicant_id: ctx.id,
      application_type: applicationType,
      status: 'pending',
      statement: statement.trim(),
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  try {
    const { data: applicantProfile } = await client
      .from('profiles')
      .select('full_name')
      .eq('id', ctx.id)
      .maybeSingle();

    if (ctx.email) {
      void sendApplicationReceivedEmail({
        recipientEmail: ctx.email,
        recipientName: applicantProfile?.full_name || 'Applicant',
        applicationType,
        statement: statement.trim(),
        applicationId: data.id,
      }).catch((e) => console.warn('Receipt email dispatch error:', e));
    }
  } catch (emailErr) {
    console.warn('Could not dispatch receipt email:', emailErr);
  }

  return { ok: true, applicationId: data.id };
}

// ---------------------------------------------------------------------------
// Review an application atomically via process_application_review RPC
// ---------------------------------------------------------------------------

export async function reviewApplication(
  applicationId: string,
  decision: 'approved' | 'rejected',
  note: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'advisor');
  if (authErr) return { ok: false, error: authErr.message };

  const client = await createSessionClient();
  if (!client) return { ok: false, error: 'Service unavailable.' };

  // Pre-flight authorization check (also enforced atomically inside DB RPC)
  const { data: app, error: fetchErr } = await client
    .from('applications')
    .select('id, applicant_id, application_type, status, reviewed_at')
    .eq('id', applicationId)
    .single();

  if (fetchErr || !app) return { ok: false, error: 'Application not found.' };
  if (app.applicant_id === ctx!.id) return { ok: false, error: 'You cannot review your own application.' };
  if (app.reviewed_at || app.status !== 'pending') {
    return { ok: false, error: 'This application has already been reviewed.' };
  }

  const isDirector = ctx!.role === 'director';
  if (!isDirector && !['core_team_application', 'alumni_verification'].includes(app.application_type)) {
    return { ok: false, error: 'Advisors can only review Core Team and Alumni Verification applications.' };
  }
  if (isDirector || app.application_type === 'advisor_application') {
    const mfaErr = requireDirectorMfa(ctx);
    if (mfaErr) return { ok: false, error: mfaErr.message };
  }

  const admin = createAdminClient();
  const { error: rpcErr } = await admin.rpc('process_application_review', {
    p_application_id: applicationId,
    p_reviewer_id: ctx!.id,
    p_decision: decision,
    p_note: note.trim(),
  });

  if (rpcErr) return { ok: false, error: rpcErr.message };

  try {
    const { data: applicantProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', app.applicant_id)
      .maybeSingle();

    const { data: userData } = await admin.auth.admin.getUserById(app.applicant_id);
    const applicantEmail = userData?.user?.email;
    const applicantName = applicantProfile?.full_name || userData?.user?.user_metadata?.full_name || 'Applicant';

    if (applicantEmail) {
      void sendApplicationDecisionEmail({
        recipientEmail: applicantEmail,
        recipientName: applicantName,
        applicationType: app.application_type,
        decision,
        note: note.trim(),
        applicationId,
      }).catch((e) => console.warn('Decision email dispatch error:', e));
    }
  } catch (emailErr) {
    console.warn('Could not dispatch decision email:', emailErr);
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Advisor nominates Core Team member for promotion to Advisor
// ---------------------------------------------------------------------------

export async function nominateForPromotion(
  nomineeId: string,
  statement: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'advisor');
  if (authErr) return { ok: false, error: authErr.message };
  if (ctx!.role === 'director') {
    const mfaErr = requireDirectorMfa(ctx);
    if (mfaErr) return { ok: false, error: mfaErr.message };
  }
  if (nomineeId === ctx!.id) return { ok: false, error: 'You cannot nominate yourself.' };

  const client = await createSessionClient();
  if (!client) return { ok: false, error: 'Service unavailable.' };

  const { data: membership } = await client
    .from('org_memberships')
    .select('id')
    .eq('user_id', nomineeId)
    .eq('role', 'core_team')
    .eq('status', 'approved')
    .is('effective_until', null)
    .maybeSingle();

  if (!membership) return { ok: false, error: 'Nominee must be an approved active Core Team member.' };

  const { error } = await client.from('applications').insert({
    applicant_id: ctx!.id,
    application_type: 'promotion_nomination',
    status: 'pending',
    statement: statement.trim(),
    nominee_id: nomineeId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Director approves/rejects a promotion nomination atomically via RPC
// ---------------------------------------------------------------------------

export async function approvePromotion(
  applicationId: string,
  decision: 'approved' | 'rejected',
  note: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getUserContext();
  const authErr = requireDirectorMfa(ctx);
  if (authErr) return { ok: false, error: authErr.message };

  const admin = createAdminClient();
  const { error: rpcErr } = await admin.rpc('process_promotion_approval', {
    p_application_id: applicationId,
    p_director_id: ctx!.id,
    p_decision: decision,
    p_note: note.trim(),
  });

  if (rpcErr) return { ok: false, error: rpcErr.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Director revokes a membership atomically via RPC
// ---------------------------------------------------------------------------

export async function revokeMembership(
  targetUserId: string,
  newStatus: 'suspended' | 'departed',
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getUserContext();
  const authErr = requireDirectorMfa(ctx);
  if (authErr) return { ok: false, error: authErr.message };
  if (targetUserId === ctx!.id) {
    return { ok: false, error: 'The Director cannot revoke their own membership this way.' };
  }

  const admin = createAdminClient();
  const { error: rpcErr } = await admin.rpc('process_membership_revocation', {
    p_target_user_id: targetUserId,
    p_director_id: ctx!.id,
    p_new_status: newStatus,
    p_reason: reason.trim(),
  });

  if (rpcErr) return { ok: false, error: rpcErr.message };
  return { ok: true };
}
