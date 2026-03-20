/**
 * Team collaboration helpers for workspace owner resolution and role checks.
 */

/**
 * Resolves the effective workspace owner for a given user.
 * If the user is a team member (accepted invite), returns their owner's ID.
 * Otherwise returns the user's own ID (they are the owner).
 */
export async function getEffectiveUserId(supabase: any, userId: string): Promise<string> {
  const { data: member } = await supabase
    .from('team_members')
    .select('owner_id')
    .eq('member_id', userId)
    .not('accepted_at', 'is', null)
    .single();
  return member?.owner_id ?? userId;
}

/**
 * Returns the role of a user within any workspace.
 * - 'owner': the user owns a workspace (has invited others or is not a member themselves)
 * - 'admin': accepted invite with role='admin'
 * - 'member': accepted invite with role='member'
 * - null: no team relationship found (treated as owner of their own solo workspace)
 */
export async function getUserRole(
  supabase: any,
  userId: string
): Promise<'owner' | 'admin' | 'member' | null> {
  // Check if this user is a member (accepted invite) in someone else's workspace
  const { data: memberRow } = await supabase
    .from('team_members')
    .select('role, accepted_at')
    .eq('member_id', userId)
    .not('accepted_at', 'is', null)
    .single();

  if (memberRow) {
    return memberRow.role as 'admin' | 'member';
  }

  // Check if this user is an owner (has invited others)
  const { data: ownerRow } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .single();

  if (ownerRow) {
    return 'owner';
  }

  // Solo user — no team relationships; treat as owner of their own workspace
  return null;
}
