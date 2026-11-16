create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  full_name text, avatar_url text, phone text,
  preferred_language text not null default 'ar' check (preferred_language in ('en','ar')),
  currency text not null default 'SAR',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  type text not null check (type in ('income','expense')), amount numeric not null,
  category text not null, description text, date date not null default current_date,
  created_at timestamptz not null default now()
);
create table public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  title text not null, description text, target_amount numeric not null, current_amount numeric not null default 0,
  deadline date, category text not null default 'savings',
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  status text not null default 'active' check (status in ('active','completed','paused')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.budgets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  category text not null, allocated_amount numeric not null, spent_amount numeric not null default 0,
  period text not null default 'monthly' check (period in ('monthly','weekly','yearly')),
  month text not null default to_char(current_date,'YYYY-MM'),
  created_at timestamptz not null default now()
);
create table public.investments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  name text not null, ticker text,
  type text not null check (type in ('stock','crypto','real_estate','bond','fund','other')),
  amount_invested numeric not null, current_value numeric not null,
  purchase_date date not null default current_date, notes text,
  created_at timestamptz not null default now()
);
create table public.debts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  name text not null, type text not null check (type in ('loan','credit_card','mortgage','other')),
  total_amount numeric not null, remaining_amount numeric not null,
  interest_rate numeric not null default 0, monthly_payment numeric not null default 0,
  due_date date, status text not null default 'active' check (status in ('active','paid_off')),
  created_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['profiles','transactions','goals','budgets','investments','debts'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows select" on public.%I for select to authenticated using (auth.uid() = user_id)', t);
    execute format('create policy "own rows insert" on public.%I for insert to authenticated with check (auth.uid() = user_id)', t);
    execute format('create policy "own rows update" on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "own rows delete" on public.%I for delete to authenticated using (auth.uid() = user_id)', t);
    execute format('create index on public.%I (user_id)', t);
  end loop;
end $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();