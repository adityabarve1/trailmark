-- NOT applied. Run this when billing launches (together with ENFORCE_PLANS = true in packages/core/src/entitlements.ts).
-- Copy it into supabase/migrations/ and run `npx supabase db push`.

-- Free plan: a roadmap may have at most 4 week rows (30 days). Pro (not expired) has no limit.
-- Enforced here as well as in the app so the limit can't be bypassed with a direct API call.
create or replace function public.enforce_roadmap_plan() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p record;
  weeks int;
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' or auth.uid() is null then return new; end if;
  select plan, plan_until into p from public.profiles where id = new.user_id;
  if p.plan = 'pro' and (p.plan_until is null or p.plan_until > now()) then return new; end if;
  select coalesce(sum(jsonb_array_length(b -> 'rows')), 0) into weeks
    from jsonb_array_elements(coalesce(new.doc -> 'weeks', '[]'::jsonb)) b;
  if weeks > 4 then
    raise exception 'The Free plan allows roadmaps up to 30 days (4 weeks). Upgrade to Pro for longer plans.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger roadmaps_plan before insert or update on public.roadmaps
  for each row execute function public.enforce_roadmap_plan();
