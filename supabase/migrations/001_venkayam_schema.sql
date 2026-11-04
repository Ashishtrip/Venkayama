-- Venkayam India: central store schema, RLS, RPCs, storage.
-- Run once in Supabase Dashboard -> SQL Editor. Safe to re-run.

-- ============ Admin allow-list ============
create table if not exists public.admins (email text primary key);
insert into public.admins(email) values ('venkayam@gmail.com'), ('ashish.deo.tripathi@gmail.com') on conflict do nothing;
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- ============ Tables ============
create table if not exists public.products (
  id text primary key, sku text not null default '', name text not null, cat text not null default 'tees',
  price int not null default 0 check (price >= 0), was int not null default 0, tag text not null default '', badge text not null default '',
  img text not null default '', gallery jsonb, emblem text, onion boolean, description text,
  sizes jsonb not null default '{}'::jsonb, sold int not null default 0, threshold int not null default 8,
  active boolean not null default true, is_drop boolean not null default false, claimed int not null default 0,
  sort bigserial, created_at timestamptz not null default now()
);
create unique index if not exists products_name_key on public.products (name);

create table if not exists public.orders (
  id text primary key, customer text not null, phone text not null default '', city text not null default '', address text not null default '',
  items jsonb not null, amount int not null, pay text not null default 'UPI', status text not null default 'Placed',
  created_at timestamptz not null default now(), note text not null default '', promo text,
  track text not null unique, delivered_at timestamptz, payment_id text
);
create table if not exists public.promos (
  id text primary key, code text not null unique, descr text not null default '', type text not null check (type in ('flat','percent')),
  value int not null, used int not null default 0, cap int not null default 100, active boolean not null default true
);
create table if not exists public.zones (
  id text primary key, name text not null, days text not null default '', fee int not null default 0, free_above int not null default 999, sort bigserial
);
create table if not exists public.looks (
  id text primary key, img text not null, label text not null default '', title text not null default '', shape text not null default 'tall', sort bigserial
);
create table if not exists public.returns (
  id text primary key, order_id text not null, track text not null, customer text not null default '', phone text not null default '', address text not null default '',
  type text not null check (type in ('Return','Exchange')), item jsonb not null, new_size text, reason text not null default '', comment text not null default '',
  status text not null default 'Requested', created_at timestamptz not null default now(), history jsonb not null default '[]'::jsonb,
  courier text not null default '', refund int not null default 0, note text not null default ''
);
create table if not exists public.settings (id int primary key default 1 check (id = 1), free_ship int not null default 999, ship_fee int not null default 79);
insert into public.settings(id) values (1) on conflict do nothing;
create table if not exists public.activity (id bigserial primary key, t bigint not null, m text not null, k text not null default 'edit');

insert into public.zones (id, name, days, fee, free_above) values
 ('z-ncr','Delhi NCR','1-2 days',49,999), ('z-south','Tamil Nadu, Kerala, Karnataka','2-4 days',79,999),
 ('z-west','Maharashtra, Telangana, Haryana','3-5 days',79,999), ('z-rest','Rest of India','5-8 days',99,999),
 ('z-ne','North-East & J&K','7-10 days',149,1999)
on conflict do nothing;

create sequence if not exists public.order_seq start 1001;
create sequence if not exists public.return_seq start 1001;

-- ============ RLS ============
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.promos enable row level security;
alter table public.zones enable row level security;
alter table public.looks enable row level security;
alter table public.returns enable row level security;
alter table public.settings enable row level security;
alter table public.activity enable row level security;

do $$ declare t text; begin
  foreach t in array array['products','orders','promos','zones','looks','returns','settings','activity'] loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format('create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
  foreach t in array array['zones','looks','settings'] loop
    execute format('drop policy if exists public_read on public.%I', t);
    execute format('create policy public_read on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;
drop policy if exists public_read on public.products;
create policy public_read on public.products for select to anon, authenticated using (active);
-- orders, returns, promos, activity, admins: no public access. Customers use the RPCs below.

-- ============ Pricing + stock (server side, never trust the client) ============
create or replace function public._quote(p_items jsonb, p_promo text, p_lock boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it jsonb; prod public.products%rowtype; q int; sz text; sub int := 0; disc int := 0; ship int; norm jsonb := '[]';
        pr public.promos%rowtype; st public.settings%rowtype;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    q := (it ->> 'qty')::int; sz := it ->> 'size';
    if q is null or q < 1 or q > 20 then raise exception 'BAD_QUANTITY'; end if;
    if p_lock then select * into prod from public.products where name = it ->> 'name' and (active or public.is_admin()) for update;
    else select * into prod from public.products where name = it ->> 'name' and (active or public.is_admin()); end if;
    if not found or prod.price <= 0 then raise exception 'UNAVAILABLE: %', it ->> 'name'; end if;
    if coalesce((prod.sizes ->> sz)::int, 0) < q then raise exception 'OUT_OF_STOCK: % (%)', prod.name, sz; end if;
    sub := sub + prod.price * q;
    norm := norm || jsonb_build_object('name', prod.name, 'size', sz, 'qty', q, 'price', prod.price);
  end loop;
  if coalesce(p_promo, '') <> '' then
    select * into pr from public.promos where code = upper(trim(p_promo));
    if not found or not pr.active or pr.used >= pr.cap then raise exception 'BAD_PROMO'; end if;
    disc := case when pr.type = 'flat' then least(pr.value, sub) else round(sub * pr.value / 100.0)::int end;
  end if;
  select * into st from public.settings where id = 1;
  ship := case when sub - disc >= st.free_ship then 0 else st.ship_fee end;
  return jsonb_build_object('items', norm, 'subtotal', sub, 'discount', disc, 'shipping', ship, 'total', sub - disc + ship);
end $$;

create or replace function public.quote_order(p jsonb) returns jsonb
language sql security definer set search_path = public as $$ select public._quote(p -> 'items', p ->> 'promo', false); $$;

create or replace function public.check_promo(p_code text, p_subtotal int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare pr public.promos%rowtype;
begin
  select * into pr from public.promos where code = upper(trim(p_code));
  if not found then return jsonb_build_object('error', 'Code not recognised'); end if;
  if not pr.active then return jsonb_build_object('error', 'Code is paused'); end if;
  if pr.used >= pr.cap then return jsonb_build_object('error', 'Code fully redeemed'); end if;
  return jsonb_build_object('code', pr.code, 'type', pr.type, 'value', pr.value);
end $$;

create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare q jsonb; adm boolean := public.is_admin(); o public.orders%rowtype; it jsonb; st text; amt int; pay text;
begin
  if length(trim(coalesce(p ->> 'customer', ''))) < 1 or length(p ->> 'customer') > 120 then raise exception 'BAD_CUSTOMER'; end if;
  q := public._quote(p -> 'items', p ->> 'promo', true);
  pay := case when p ->> 'pay' = 'Card' then 'Card' else 'UPI' end;
  st := case when adm and (p ->> 'status') in ('Placed','Printing','Packed','Shipped','Delivered','Returned') then p ->> 'status' else 'Placed' end;
  amt := case when adm and p ? 'amount' then (p ->> 'amount')::int else (q ->> 'total')::int end;
  insert into public.orders (id, customer, phone, city, address, items, amount, pay, status, promo, track, payment_id, delivered_at)
  values ('VNK-' || nextval('public.order_seq'), left(trim(p ->> 'customer'), 120), left(coalesce(p ->> 'phone', ''), 20), left(coalesce(p ->> 'city', ''), 80),
          left(coalesce(p ->> 'address', ''), 400), q -> 'items', amt, pay, st, nullif(upper(trim(coalesce(p ->> 'promo', ''))), ''),
          upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), left(p ->> 'payment_id', 80), case when st = 'Delivered' then now() end)
  returning * into o;
  for it in select * from jsonb_array_elements(q -> 'items') loop
    update public.products set
      sizes = jsonb_set(sizes, array[it ->> 'size'], to_jsonb(greatest(0, (sizes ->> (it ->> 'size'))::int - (it ->> 'qty')::int))),
      sold = sold + (it ->> 'qty')::int, claimed = claimed + (it ->> 'qty')::int
    where name = it ->> 'name';
  end loop;
  if o.promo is not null then update public.promos set used = used + 1 where code = o.promo; end if;
  insert into public.activity (t, m, k) values ((extract(epoch from now()) * 1000)::bigint,
    o.id || ' placed, Rs ' || o.amount || ', ' || o.pay || ', ' || coalesce(nullif(o.city, ''), 'n/a'), 'order');
  return to_jsonb(o) - 'payment_id';
end $$;

-- ============ Customer lookups (code + phone, never table access) ============
create or replace function public._digits10(v text) returns text language sql immutable as $$
  select right(regexp_replace(coalesce(v, ''), '\D', '', 'g'), 10);
$$;

create or replace function public.track_order(p_code text, p_phone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype;
begin
  select * into o from public.orders where track = upper(trim(p_code));
  if not found or length(public._digits10(p_phone)) < 10 or (o.phone <> '' and public._digits10(o.phone) <> public._digits10(p_phone)) then return null; end if;
  return jsonb_build_object('order', to_jsonb(o) - 'payment_id',
    'returns', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.returns r where r.order_id = o.id), '[]'::jsonb));
end $$;

create or replace function public.get_return(p_id text, p_phone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.returns%rowtype;
begin
  select * into r from public.returns where id = upper(trim(p_id));
  if not found or length(public._digits10(p_phone)) < 10 or (r.phone <> '' and public._digits10(r.phone) <> public._digits10(p_phone)) then return null; end if;
  return to_jsonb(r);
end $$;

create or replace function public.request_return(p_code text, p_phone text, p_item_name text, p_item_size text, p_type text, p_new_size text, p_reason text, p_comment text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders%rowtype; it jsonb; prod public.products%rowtype; r public.returns%rowtype; typ text := p_type; now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  select * into o from public.orders where track = upper(trim(p_code));
  if not found or length(public._digits10(p_phone)) < 10 or (o.phone <> '' and public._digits10(o.phone) <> public._digits10(p_phone)) then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status <> 'Delivered' then raise exception 'NOT_DELIVERED'; end if;
  if now() - coalesce(o.delivered_at, o.created_at) > interval '7 days' then raise exception 'WINDOW_CLOSED'; end if;
  select e into it from jsonb_array_elements(o.items) e where e ->> 'name' = p_item_name and e ->> 'size' = p_item_size limit 1;
  if it is null then raise exception 'ITEM_NOT_IN_ORDER'; end if;
  if exists (select 1 from public.returns x where x.order_id = o.id and x.item ->> 'name' = p_item_name and x.item ->> 'size' = p_item_size and x.status <> 'Rejected') then raise exception 'ALREADY_REQUESTED'; end if;
  select * into prod from public.products where name = p_item_name;
  if found and (prod.is_drop or prod.was > prod.price) then typ := 'Exchange'; end if;
  if typ not in ('Return','Exchange') then raise exception 'BAD_TYPE'; end if;
  if typ = 'Exchange' then
    if p_new_size is null or p_new_size = p_item_size or coalesce((prod.sizes ->> p_new_size)::int, 0) < (it ->> 'qty')::int then raise exception 'SIZE_UNAVAILABLE'; end if;
  end if;
  insert into public.returns (id, order_id, track, customer, phone, address, type, item, new_size, reason, comment, history, refund)
  values ('RET-' || nextval('public.return_seq'), o.id, o.track, o.customer, o.phone, o.address, typ, it, case when typ = 'Exchange' then p_new_size end,
          left(coalesce(p_reason, ''), 120), left(coalesce(p_comment, ''), 600), jsonb_build_array(jsonb_build_object('t', now_ms, 's', 'Requested')),
          case when typ = 'Return' then (it ->> 'price')::int * (it ->> 'qty')::int else 0 end)
  returning * into r;
  insert into public.activity (t, m, k) values (now_ms, r.id || ' ' || lower(typ) || ' requested for ' || o.id, 'alert');
  return to_jsonb(r);
end $$;

-- ============ Admin: atomic stock change ============
create or replace function public.stock_change(p_id text, p_size text, p_value int, p_relative boolean) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.products set sizes = jsonb_set(sizes, array[p_size],
    to_jsonb(greatest(0, case when p_relative then coalesce((sizes ->> p_size)::int, 0) + p_value else p_value end)))
  where id = p_id returning (sizes ->> p_size)::int into v;
  return v;
end $$;

-- ============ Grants ============
revoke all on function public._quote(jsonb, text, boolean) from public, anon, authenticated;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
revoke all on function public.quote_order(jsonb), public.check_promo(text, int), public.place_order(jsonb), public.track_order(text, text),
  public.get_return(text, text), public.request_return(text, text, text, text, text, text, text, text), public.stock_change(text, text, int, boolean) from public;
grant execute on function public.quote_order(jsonb), public.check_promo(text, int), public.place_order(jsonb), public.track_order(text, text),
  public.get_return(text, text), public.request_return(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.stock_change(text, text, int, boolean) to authenticated;

-- ============ Storage: public product/look images, admin-only writes ============
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do update set public = true;
drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select to anon, authenticated using (bucket_id = 'media');
drop policy if exists media_admin_write on storage.objects;
create policy media_admin_write on storage.objects for all to authenticated using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
