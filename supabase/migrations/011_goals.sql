-- Goals table
create table if not exists goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  category     text not null default 'personal',
  target_date  date,
  status       text not null default 'active' check (status in ('active','completed','paused','abandoned')),
  progress     int not null default 0 check (progress >= 0 and progress <= 100),
  milestones   jsonb not null default '[]'::jsonb,
  linked_habit_ids uuid[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table goals enable row level security;

create policy "goals: owner select" on goals for select using (auth.uid() = user_id);
create policy "goals: owner insert" on goals for insert with check (auth.uid() = user_id);
create policy "goals: owner update" on goals for update using (auth.uid() = user_id);
create policy "goals: owner delete" on goals for delete using (auth.uid() = user_id);

create index goals_user_status on goals (user_id, status);
create index goals_user_created on goals (user_id, created_at desc);
