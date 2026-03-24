-- Migration 3: post_metrics table for engagement tracking
create table if not exists post_metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  platform text not null,
  likes int default 0,
  shares int default 0,
  reach int default 0,
  impressions int default 0,
  fetched_at timestamptz default now(),
  unique(post_id, platform)
);

-- RLS
alter table post_metrics enable row level security;

create policy "Users can view own post metrics"
  on post_metrics for select
  using (
    exists (
      select 1 from posts
      where posts.id = post_metrics.post_id
      and posts.user_id = auth.uid()
    )
  );
