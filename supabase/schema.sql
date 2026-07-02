-- PayFlow AI — fresh schema
-- Run this in the Supabase SQL editor for a clean project (or after
-- dropping the old `invoices` table if reusing the existing project).

-- CASCADE handles leftover tables from earlier iterations of this project
-- (e.g. a `reminders` table with a foreign key into `invoices`).
drop table if exists reminders cascade;
drop table if exists invoices cascade;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  customer_name text not null,
  customer_email text not null,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  nomba_order_reference text unique,
  nomba_checkout_link text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index invoices_status_idx on invoices (status);
create index invoices_order_reference_idx on invoices (nomba_order_reference);
create index invoices_user_id_idx on invoices (user_id);

-- Row Level Security: every policy is scoped to auth.uid(), so a signed-in
-- user can only ever see or modify their own rows even if a client-side
-- bug or a compromised anon key tried to query broadly. API routes use the
-- SSR-aware server client (respects RLS + the caller's session) for reads,
-- and only reach for the service-role client after independently verifying
-- the session server-side.
alter table invoices enable row level security;

create policy "Users can view their own invoices"
  on invoices for select
  using (auth.uid() = user_id);

create policy "Users can insert their own invoices"
  on invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own invoices"
  on invoices for update
  using (auth.uid() = user_id);
