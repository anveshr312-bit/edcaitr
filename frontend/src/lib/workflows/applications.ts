/**
 * Application workflow server actions.
 * All functions are server-side only (import only from server components or route handlers).
 * Client cannot directly call these — they go through API routes.
 */
import {
  createSessionClient,
  getUserContext,
  requireRole,
  requireDirectorMfa,
  type AppRole,
} from '../auth/authorization';

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

  // Check for an existing pending application of the same type
  const { data: existing } = await client
    .from('applications')
    .select('id')
    .eq('applicant_id', ctx.id)
    .eq('application_type', applicationType)
    .is('reviewed_at', null)
    .single();

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
  return { ok: true, applicationId: data.id };
}

// ---------------------------------------------------------------------------
// Advisor reviews a core_team_application or alumni_verification
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

  // Fetch the application to validate type and prevent self-approval
  const { data: app, error: fetchErr } = await client
    .from('applications')
    .select('id, applicant_id, application_type, status, reviewed_at')
    .eq('id', applicationId)
    .single();

  if (fetchErr || !app) return { ok: false, error: 'Application not found.' };
  if (app.applicant_id === ctx!.id) return { ok: false, error: 'You cannot review your own application.' };
  if (app.reviewed_at) return { ok: false, error: 'This application has already been reviewed.' };
  if (app.status !== 'pending') return { ok: false, error: 'Only pending applications can be reviewed.' };

  // Advisors can only review core_team_application and alumni_verification
  const isDirector = ctx!.role === 'director';
  if (!isDirector && !['core_team_application', 'alumni_verification'].includes(app.application_type)) {
    return { ok: false, error: 'Advisors can only review Core Team and Alumni Verification applications.' };
  }
  if (app.application_type === 'advisor_application') {
    const mfaErr = requireDirectorMfa(ctx);
    if (mfaErr) return { ok: false, error: mfaErr.message };
  }

  const { error: updateErr } = await client
    .from('applications')
    .update({
      status: decision,
      reviewed_by: ctx!.id,
      reviewed_at: new Date().toISOString(),
      review_note: note.trim(),
    })
    .eq('id', applicationId);

  if (updateErr) return { ok: false, error: updateErr.message };

  // If approved, create the org membership (via service-role to bypass RLS)
  if (decision === 'approved') {
    const roleMap: Record<string, AppRole> = {
      core_team_application: 'core_team',
      alumni_verification: 'alumni',
      advisor_application: 'advisor',
    };
    const grantedRole = roleMap[app.application_type];
    if (grantedRole) {
      const { createAdminClient } = await import('../auth/authorization');
      const admin = createAdminClient();
      await admin.from('org_memberships').insert({
        user_id: app.applicant_id,
        role: grantedRole,
        status: 'approved',
        reviewed_by: ctx!.id,
        reviewed_at: new Date().toISOString(),
        effective_from: new Date().toISOString().slice(0, 10),
      });

      await admin.from('audit_log').insert({
        actor_id: ctx!.id,
        event: 'role_granted',
        target_id: app.applicant_id,
        target_type: 'org_membership',
        detail: { role: grantedRole, application_id: applicationId, decision },
      });
    }
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
  if (nomineeId === ctx!.id) return { ok: false, error: 'You cannot nominate yourself.' };

  const client = await createSessionClient();
  if (!client) return { ok: false, error: 'Service unavailable.' };

  // Verify nominee is an approved Core Team member
  const { data: membership } = await client
    .from('org_memberships')
    .select('id')
    .eq('user_id', nomineeId)
    .eq('role', 'core_team')
    .eq('status', 'approved')
    .is('effective_until', null)
    .single();

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
// Director approves a promotion nomination
// ---------------------------------------------------------------------------

export async function approvePromotion(
  applicationId: string,
  decision: 'approved' | 'rejected',
  note: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getUserContext();
  const authErr = requireDirectorMfa(ctx);
  if (authErr) return { ok: false, error: authErr.message };

  const client = await createSessionClient();
  if (!client) return { ok: false, error: 'Service unavailable.' };

  const { data: app } = await client
    .from('applications')
    .select('id, applicant_id, nominee_id, application_type, status, reviewed_at')
    .eq('id', applicationId)
    .eq('application_type', 'promotion_nomination')
    .single();

  if (!app) return { ok: false, error: 'Nomination not found.' };
  if (app.reviewed_at) return { ok: false, error: 'Already reviewed.' };
  if (!app.nominee_id) return { ok: false, error: 'Nominee ID is missing.' };

  const { error: updateErr } = await client
    .from('applications')
    .update({
      status: decision,
      reviewed_by: ctx!.id,
      reviewed_at: new Date().toISOString(),
      review_note: note.trim(),
    })
    .eq('id', applicationId);

  if (updateErr) return { ok: false, error: updateErr.message };

  if (decision === 'approved') {
    const { createAdminClient } = await import('../auth/authorization');
    const admin = createAdminClient();

    // Deactivate existing core_team membership
    await admin
      .from('org_memberships')
      .update({ status: 'departed', effective_until: new Date().toISOString().slice(0, 10) })
      .eq('user_id', app.nominee_id)
      .eq('role', 'core_team')
      .eq('status', 'approved');

    // Grant Advisor membership
    await admin.from('org_memberships').insert({
      user_id: app.nominee_id,
      role: 'advisor',
      status: 'approved',
      reviewed_by: ctx!.id,
      reviewed_at: new Date().toISOString(),
      effective_from: new Date().toISOString().slice(0, 10),
    });

    await admin.from('audit_log').insert({
      actor_id: ctx!.id,
      event: 'promotion_approved',
      target_id: app.nominee_id,
      target_type: 'org_membership',
      detail: {
        from_role: 'core_team',
        to_role: 'advisor',
        nominated_by: app.applicant_id,
        application_id: applicationId,
      },
    });
  } else {
    const { createAdminClient } = await import('../auth/authorization');
    const admin = createAdminClient();
    await admin.from('audit_log').insert({
      actor_id: ctx!.id,
      event: 'promotion_rejected',
      target_id: app.nominee_id,
      target_type: 'application',
      detail: { application_id: applicationId, reason: note },
    });
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Director revokes a membership (suspend or mark departed)
// ---------------------------------------------------------------------------

export async function revokeMembership(
  targetUserId: string,
  newStatus: 'suspended' | 'departed',
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getUserContext();
  const authErr = requireDirectorMfa(ctx);
  if (authErr) return { ok: false, error: authErr.message };
  if (targetUserId === ctx!.id) return { ok: false, error: 'The Director cannot revoke their own membership this way.' };

  const { createAdminClient } = await import('../auth/authorization');
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('org_memberships')
    .update({
      status: newStatus,
      effective_until: new Date().toISOString().slice(0, 10),
      handover_note: reason,
    })
    .eq('user_id', targetUserId)
    .eq('status', 'approved')
    .select();

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: 'No active membership found for this user.' };

  await admin.from('audit_log').insert({
    actor_id: ctx!.id,
    event: newStatus === 'suspended' ? 'membership_suspended' : 'membership_departed',
    target_id: targetUserId,
    target_type: 'org_membership',
    detail: { reason, affected_records: data.length },
  });

  return { ok: true };
}
