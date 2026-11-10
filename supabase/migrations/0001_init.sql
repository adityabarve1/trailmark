-- Trailmark schema. Run with `supabase db push` or paste into the SQL editor.
-- Every table is private to its owner through Row Level Security.
-- There is deliberately NO column for LLM API keys anywhere: keys never leave the user's device.

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  headline text,
  timezone text not null default 'UTC',
  active_roadmap_id uuid,
  created_at timestamptz not null default now()
);

-- Create a profile row for every new auth user.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- roadmaps (the roadmap.v1 document) ----------
create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  doc jsonb not null check (doc ->> 'schema' = 'roadmap.v1' and pg_column_size(doc) < 1500000),
  created_at timestamptz not null default now()
);
create index roadmaps_user_idx on public.roadmaps (user_id, created_at desc);

alter table public.profiles
  add constraint profiles_active_roadmap_fk foreign key (active_roadmap_id) references public.roadmaps (id) on delete set null;

-- ---------- progress: all checkbox state for one roadmap ----------
create table public.progress (
  roadmap_id uuid primary key references public.roadmaps (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 500000),
  updated_at timestamptz not null default now()
);

-- ---------- day logs ----------
create table public.day_logs (
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  day date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 20000),
  updated_at timestamptz not null default now(),
  primary key (roadmap_id, day)
);
create index day_logs_user_idx on public.day_logs (user_id, day);

-- ---------- practice items (DSA problems or any practice) ----------
create table public.practice_items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  pattern text not null default 'General',
  difficulty text not null default 'Medium',
  status text not null default 'a' check (status in ('g', 'a', 'r')),
  solved_on date not null default current_date,
  r7 date,
  r30 date,
  created_at timestamptz not null default now()
);
create index practice_roadmap_idx on public.practice_items (roadmap_id, solved_on desc);

-- ---------- weekly reviews ----------
create table public.weekly_reviews (
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  week int not null check (week between 1 and 104),
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 20000),
  updated_at timestamptz not null default now(),
  primary key (roadmap_id, week)
);

-- ---------- 1-day buffer for logs ----------
-- Users may create or change a day's log only for today or yesterday, in their own time zone.
-- The service role (used by the owner seed script / admin imports) is exempt.
-- Deletes are not checked so that deleting a roadmap or account can cascade.
create or replace function public.enforce_log_window() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  tz text;
  today date;
  target date;
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;
  select coalesce(timezone, 'UTC') into tz from public.profiles where id = auth.uid();
  today := (now() at time zone coalesce(tz, 'UTC'))::date;
  target := new.day;
  if target > today or target < today - 1 then
    raise exception 'Logs can only be added or changed for today and yesterday.' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and new.day <> old.day then
    raise exception 'A log''s date can''t be changed.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger day_logs_window before insert or update on public.day_logs
  for each row execute function public.enforce_log_window();

-- Keep user_id honest: rows can only point at the caller's own roadmap.
create or replace function public.enforce_roadmap_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then return new; end if;
  if not exists (select 1 from public.roadmaps r where r.id = new.roadmap_id and r.user_id = auth.uid()) then
    raise exception 'Roadmap not found.' using errcode = 'P0001';
  end if;
  new.user_id := auth.uid();
  return new;
end $$;

create trigger progress_owner before insert or update on public.progress for each row execute function public.enforce_roadmap_owner();
create trigger day_logs_owner before insert or update on public.day_logs for each row execute function public.enforce_roadmap_owner();
create trigger practice_owner before insert or update on public.practice_items for each row execute function public.enforce_roadmap_owner();
create trigger reviews_owner before insert or update on public.weekly_reviews for each row execute function public.enforce_roadmap_owner();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.roadmaps enable row level security;
alter table public.progress enable row level security;
alter table public.day_logs enable row level security;
alter table public.practice_items enable row level security;
alter table public.weekly_reviews enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "own roadmaps" on public.roadmaps for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own progress" on public.progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own logs" on public.day_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own practice" on public.practice_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own reviews" on public.weekly_reviews for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The active roadmap must belong to the user.
create or replace function public.enforce_active_roadmap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.active_roadmap_id is not null and not exists (
    select 1 from public.roadmaps r where r.id = new.active_roadmap_id and r.user_id = new.id) then
    raise exception 'Roadmap not found.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger profiles_active_roadmap before update on public.profiles for each row execute function public.enforce_active_roadmap();
