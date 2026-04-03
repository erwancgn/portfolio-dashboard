create table public.dividends_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  source text,
  payload jsonb not null,
  computed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique(user_id, ticker)
);

create index dividends_cache_user_expires_idx
  on public.dividends_cache(user_id, expires_at desc);

alter table public.dividends_cache enable row level security;

create policy "Users can manage their own dividends cache"
  on public.dividends_cache
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
