-- PayFlow AI — fresh schema
-- Run this in the Supabase SQL editor for a clean project (or after
-- dropping the old `invoices` table if reusing the existing project).

drop table if exists invoices;

create table invoices (
  id uuid primary key default gen_random_uuid(),
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

-- Row Level Security: reads/writes go through the API routes using the
-- service role key, so we lock the table down from the anon/public key by
-- default. If you later add client-side reads (e.g. a public invoice
-- status page), add a scoped policy for that specific case.
alter table invoices enable row level security;
