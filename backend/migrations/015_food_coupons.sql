-- Migration 015: Food Coupons & Meal Redemption Management
-- Allows event creators to issue food coupons (breakfast, lunch, high tea, dinner)
-- and coordinators to redeem them via QR scanner with anti-duplicate enforcement.

create table if not exists public.food_coupons (
  id              uuid        primary key default gen_random_uuid(),
  event_id        uuid        not null references public.events(id) on delete cascade,
  registration_id uuid        not null references public.registrations(id) on delete cascade,
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  coupon_code     text        not null unique,
  meal_type       text        not null check (meal_type in ('breakfast', 'lunch', 'high_tea', 'dinner')),
  meal_title      text        not null,
  qr_token        text        not null unique,
  status          text        not null default 'active' check (status in ('active', 'redeemed', 'expired')),
  redeemed_at     timestamptz,
  redeemed_by     uuid        references public.profiles(id),
  created_at      timestamptz not null default now()
);

create index if not exists idx_food_coupons_event on public.food_coupons(event_id);
create index if not exists idx_food_coupons_reg on public.food_coupons(registration_id);
create index if not exists idx_food_coupons_qr on public.food_coupons(qr_token);

alter table public.food_coupons enable row level security;

-- Participants can view their own food coupons
create policy "Users can view own food coupons"
  on public.food_coupons
  for select
  using (auth.uid() = user_id or exists (
    select 1 from public.events e
    where e.id = event_id and (
      e.created_by = auth.uid() or
      public.is_event_spoc(e.id, auth.uid()) or
      public.is_core_team_or_above(auth.uid())
    )
  ));

-- Coordinators / service_role can redeem
create policy "Coordinators can update food coupons"
  on public.food_coupons
  for update
  using (exists (
    select 1 from public.events e
    where e.id = event_id and (
      e.created_by = auth.uid() or
      public.is_event_spoc(e.id, auth.uid()) or
      public.is_core_team_or_above(auth.uid())
    )
  ));
