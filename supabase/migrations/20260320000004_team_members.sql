-- Migration 4: team_members table for collaboration
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  member_id uuid references auth.users(id) on delete cascade,
  invited_email text not null,
  role text not null check (role in ('admin', 'member')),
  invite_token text unique,
  accepted_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table team_members enable row level security;

create policy "Owners can manage their team"
  on team_members for all
  using (owner_id = auth.uid());

create policy "Members can view their own membership"
  on team_members for select
  using (member_id = auth.uid());
