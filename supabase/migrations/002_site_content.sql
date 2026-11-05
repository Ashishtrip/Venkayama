-- Migration 002: site_content table for custom dynamic storefront content (e.g. hero cards)

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.site_content enable row level security;

-- Public can read
drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content
  for select to anon, authenticated using (true);

-- Only admins can insert / update / delete
drop policy if exists site_content_admin_all on public.site_content;
create policy site_content_admin_all on public.site_content
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Pre-populate default hero cards if not already set
insert into public.site_content (key, value)
values (
  'hero',
  '[
    {"productId": "GEN-036", "badge": "Staff pick", "kicker": "Series 004 // Hero spec"},
    {"productId": "GEN-014", "badge": "Hot right now", "kicker": "Series 004 // Hero spec"}
  ]'::jsonb
)
on conflict (key) do nothing;

