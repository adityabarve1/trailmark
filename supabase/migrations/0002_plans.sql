-- Plans. 'free' or 'pro'. plan_until null on a pro plan means it never expires (lifetime).
alter table public.profiles
  add column plan text not null default 'free' check (plan in ('free', 'pro')),
  add column plan_until timestamptz;

-- Users must not be able to upgrade themselves through the profile update policy.
-- Only the service role (seed script, future Razorpay webhook) may change plan fields.
create or replace function public.protect_plan_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' or auth.uid() is null then return new; end if;
  if new.plan is distinct from old.plan or new.plan_until is distinct from old.plan_until then
    raise exception 'Plan can only be changed by an administrator.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger profiles_protect_plan before update on public.profiles
  for each row execute function public.protect_plan_fields();
