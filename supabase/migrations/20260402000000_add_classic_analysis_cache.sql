create table public.classic_analysis_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  method text not null check (method in ('buffett', 'lynch')),
  signal text check (signal in ('BUY', 'HOLD', 'SELL')),
  score integer,
  analysis text,
  metadata jsonb,
  computed_at timestamptz not null default now(),
  unique(user_id, ticker, method)
);

alter table public.classic_analysis_cache enable row level security;

create policy "Users can manage their own classic analysis cache"
  on public.classic_analysis_cache
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
