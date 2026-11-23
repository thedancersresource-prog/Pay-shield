-- TAPPED: self-serve URL claims + security lockdown.
-- Run once in Supabase: SQL Editor > New query > paste all of this > Run.

-- 1. Hashed passwords (plain-text passwords are upgraded automatically on each user's next login)
alter table public.performers add column if not exists password_hash text;
alter table public.performers alter column password drop not null;

-- 2. Paid Shopify orders, filled by the Shopify webhook
create table if not exists public.shop_orders (
  order_name       text primary key,
  email            text not null,
  paid_at          timestamptz not null default now(),
  claimed_slug     text,
  claimed_at       timestamptz,
  chips_programmed boolean not null default false
);

-- 3. Lock every table. The website now goes through the server API (which uses the
--    service role key), so the public anon key can no longer read passwords or data.
do $$
declare t text; p record;
begin
  foreach t in array array['performers','pay_links','venues','nfc_chips','tap_events','tip_interactions','shop_orders'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
        execute format('drop policy %I on public.%I', p.policyname, t);
      end loop;
    end if;
  end loop;
end $$;

-- 4. One account per URL
create unique index if not exists performers_slug_unique on public.performers (slug);
