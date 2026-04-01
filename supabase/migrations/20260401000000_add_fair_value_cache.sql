create table public.fair_value_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  fair_value numeric,
  signal text check (signal in ('undervalued', 'fair', 'overvalued')),
  analysis text,
  sources jsonb,
  computed_at timestamptz not null default now(),
  unique(user_id, ticker)
);

alter table public.fair_value_cache enable row level security;

create policy "Users can manage their own fair value cache"
  on public.fair_value_cache
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
