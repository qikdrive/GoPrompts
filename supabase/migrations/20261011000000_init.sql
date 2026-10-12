-- GoPrompts initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.prompt_status as enum ('draft', 'pending', 'live', 'rejected');
create type public.user_role as enum ('user', 'admin');

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user, created by trigger)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  name text not null default '',
  bio text not null default '' check (char_length(bio) <= 300),
  avatar_hue int not null default floor(random() * 360)::int,
  role public.user_role not null default 'user',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
begin
  base := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'handle', split_part(new.email, '@', 1), 'user'),
    '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then
    base := base || 'user';
  end if;
  base := left(base, 24);
  candidate := base;
  while exists (select 1 from public.profiles where handle = candidate) loop
    candidate := base || floor(random() * 100000)::text;
  end loop;

  insert into public.profiles (id, handle, name)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table public.categories (
  slug text primary key,
  name text not null,
  icon text not null,
  position int not null default 0
);

insert into public.categories (slug, name, icon, position) values
  ('marketing', 'Marketing', 'Megaphone', 1),
  ('writing', 'Writing', 'PenLine', 2),
  ('coding', 'Coding', 'Code', 3),
  ('business', 'Business', 'Briefcase', 4),
  ('art', 'Art & Design', 'Palette', 5),
  ('photography', 'Photography', 'Camera', 6),
  ('education', 'Education', 'GraduationCap', 7),
  ('productivity', 'Productivity', 'Zap', 8);

-- ---------------------------------------------------------------------------
-- App settings (single row)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  id boolean primary key default true check (id),
  -- While true, paid prompts can be "bought" without payment (demo checkout).
  -- Set to false once Stripe is wired up.
  demo_payments boolean not null default true,
  platform_fee_bps int not null default 2000 check (platform_fee_bps between 0 and 10000),
  test_runs_per_day int not null default 3
);
insert into public.app_settings default values;

-- ---------------------------------------------------------------------------
-- Prompts (public listing data; the template lives in prompt_secrets)
-- ---------------------------------------------------------------------------
create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,100}$'),
  title text not null check (char_length(title) between 3 and 80),
  description text not null check (char_length(description) between 10 and 500),
  category text not null references public.categories (slug),
  model text not null check (model in ('ChatGPT', 'Claude', 'Gemini', 'Midjourney', 'Stable Diffusion', 'DALL·E', 'Sora')),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  variables text[] not null default '{}',
  price_cents int not null default 0 check (price_cents between 0 and 100000),
  cover_hue int not null default 265 check (cover_hue between 0 and 359),
  status public.prompt_status not null default 'pending',
  featured boolean not null default false,
  rejection_reason text,
  views int not null default 0,
  sales_count int not null default 0,
  rating_avg numeric(2, 1) not null default 0,
  review_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prompts_status_idx on public.prompts (status);
create index prompts_creator_idx on public.prompts (creator_id);
create index prompts_category_idx on public.prompts (category);

create table public.prompt_secrets (
  prompt_id uuid primary key references public.prompts on delete cascade,
  template text not null check (char_length(template) between 10 and 10000)
);

create table public.prompt_examples (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts on delete cascade,
  input jsonb not null default '{}',
  output text not null check (char_length(output) <= 5000),
  position int not null default 0
);
create index prompt_examples_prompt_idx on public.prompt_examples (prompt_id);

-- Non-admins may not publish, feature or reject their own listings.
create or replace function public.guard_prompt_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.featured := old.featured;
    new.rejection_reason := old.rejection_reason;
    if new.status is distinct from old.status and new.status not in ('draft', 'pending') then
      raise exception 'Only admins can set status to %', new.status;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger prompts_guard_update
  before update on public.prompts
  for each row execute function public.guard_prompt_update();

-- ---------------------------------------------------------------------------
-- Purchases (written only by security-definer functions / service role)
-- ---------------------------------------------------------------------------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles on delete cascade,
  -- restrict: a prompt that has been sold can't be deleted (buyers keep access)
  prompt_id uuid not null references public.prompts on delete restrict,
  amount_cents int not null check (amount_cents >= 0),
  platform_fee_cents int not null default 0 check (platform_fee_cents >= 0),
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  stripe_payment_intent text unique,
  created_at timestamptz not null default now(),
  unique (buyer_id, prompt_id)
);
create index purchases_prompt_idx on public.purchases (prompt_id);

create or replace function public.has_prompt_access(p_prompt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    public.is_admin()
    or exists (select 1 from public.prompts p
               where p.id = p_prompt_id
                 and (p.creator_id = auth.uid() or (p.price_cents = 0 and p.status = 'live')))
    or exists (select 1 from public.purchases pu
               where pu.prompt_id = p_prompt_id and pu.buyer_id = auth.uid() and pu.status = 'paid')
  );
$$;

-- ---------------------------------------------------------------------------
-- Reviews, favorites, reports, test runs
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (prompt_id, user_id)
);

create table public.favorites (
  user_id uuid not null references public.profiles on delete cascade,
  prompt_id uuid not null references public.prompts on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts on delete cascade,
  reporter_id uuid not null references public.profiles on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table public.test_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  prompt_id uuid not null references public.prompts on delete cascade,
  created_at timestamptz not null default now()
);
create index test_runs_user_day_idx on public.test_runs (user_id, prompt_id, created_at);

-- ---------------------------------------------------------------------------
-- Denormalized counters
-- ---------------------------------------------------------------------------
create or replace function public.refresh_prompt_sales()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := coalesce(new.prompt_id, old.prompt_id);
begin
  update public.prompts
     set sales_count = (select count(*) from public.purchases where prompt_id = pid and status = 'paid')
   where id = pid;
  return null;
end;
$$;

create trigger purchases_refresh_sales
  after insert or update or delete on public.purchases
  for each row execute function public.refresh_prompt_sales();

create or replace function public.refresh_prompt_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := coalesce(new.prompt_id, old.prompt_id);
begin
  update public.prompts p
     set review_count = s.n,
         rating_avg = coalesce(s.avg, 0)
    from (select count(*) as n, round(avg(rating), 1) as avg
            from public.reviews where prompt_id = pid) s
   where p.id = pid;
  return null;
end;
$$;

create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_prompt_rating();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Count a listing view.
create or replace function public.increment_prompt_views(p_prompt_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.prompts set views = views + 1 where id = p_prompt_id and status = 'live';
$$;

-- Add a prompt to the caller's library. Free prompts always; paid prompts only
-- while demo_payments is on. Real payments will insert purchases from a Stripe
-- webhook using the service role instead.
create or replace function public.acquire_prompt(p_prompt_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prompt public.prompts;
  v_settings public.app_settings;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into v_prompt from public.prompts where id = p_prompt_id and status = 'live';
  if not found then
    raise exception 'Prompt not available';
  end if;
  if v_prompt.creator_id = auth.uid() then
    raise exception 'You already own this prompt';
  end if;

  select * into v_settings from public.app_settings;
  if v_prompt.price_cents > 0 and not v_settings.demo_payments then
    raise exception 'Payment required';
  end if;

  insert into public.purchases (buyer_id, prompt_id, amount_cents, platform_fee_cents)
  values (auth.uid(), p_prompt_id, v_prompt.price_cents,
          v_prompt.price_cents * v_settings.platform_fee_bps / 10000)
  on conflict (buyer_id, prompt_id) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

-- Record a "try before you buy" run; returns runs left today, or raises when out.
create or replace function public.record_test_run(p_prompt_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit int;
  v_used int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if not exists (select 1 from public.prompts where id = p_prompt_id and status = 'live') then
    raise exception 'Prompt not available';
  end if;

  select test_runs_per_day into v_limit from public.app_settings;
  select count(*) into v_used from public.test_runs
   where user_id = auth.uid() and prompt_id = p_prompt_id and created_at > now() - interval '1 day';

  if v_used >= v_limit then
    raise exception 'Daily test limit reached';
  end if;

  insert into public.test_runs (user_id, prompt_id) values (auth.uid(), p_prompt_id);
  return v_limit - v_used - 1;
end;
$$;

create or replace function public.test_runs_left(p_prompt_id uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(0, (select test_runs_per_day from public.app_settings) - (
    select count(*)::int from public.test_runs
     where user_id = auth.uid() and prompt_id = p_prompt_id and created_at > now() - interval '1 day'));
$$;

-- Create a listing with its template and examples in one transaction.
-- Runs as the caller, so RLS applies.
create or replace function public.create_listing(
  p_slug text,
  p_title text,
  p_description text,
  p_category text,
  p_model text,
  p_tags text[],
  p_variables text[],
  p_price_cents int,
  p_cover_hue int,
  p_status public.prompt_status,
  p_template text,
  p_examples jsonb
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_example jsonb;
  v_pos int := 0;
begin
  insert into public.prompts (creator_id, slug, title, description, category, model, tags,
                              variables, price_cents, cover_hue, status)
  values (auth.uid(), p_slug, p_title, p_description, p_category, p_model, p_tags,
          p_variables, p_price_cents, p_cover_hue, p_status)
  returning id into v_id;

  insert into public.prompt_secrets (prompt_id, template) values (v_id, p_template);

  for v_example in select * from jsonb_array_elements(coalesce(p_examples, '[]'::jsonb)) loop
    insert into public.prompt_examples (prompt_id, input, output, position)
    values (v_id, coalesce(v_example -> 'input', '{}'::jsonb), v_example ->> 'output', v_pos);
    v_pos := v_pos + 1;
  end loop;

  return p_slug;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- Supabase grants everything on public tables to anon/authenticated by default;
-- narrow writes to the columns users may actually set. RLS does the rest.
-- ---------------------------------------------------------------------------
revoke insert, update on public.profiles from anon, authenticated;
grant update (handle, name, bio, avatar_hue) on public.profiles to authenticated;

revoke insert, update on public.prompts from anon, authenticated;
grant insert (creator_id, slug, title, description, category, model, tags, variables, price_cents, cover_hue, status)
  on public.prompts to authenticated;
grant update (title, description, category, model, tags, variables, price_cents, cover_hue, status, featured, rejection_reason)
  on public.prompts to authenticated;

revoke insert, update, delete on public.purchases, public.test_runs, public.categories from anon, authenticated;
revoke insert, delete on public.app_settings from anon, authenticated;
revoke update on public.app_settings from anon;

revoke execute on function public.acquire_prompt(uuid), public.record_test_run(uuid),
  public.test_runs_left(uuid), public.create_listing(text, text, text, text, text, text[], text[], int, int, public.prompt_status, text, jsonb)
  from public, anon;
grant execute on function public.acquire_prompt(uuid), public.record_test_run(uuid),
  public.test_runs_left(uuid), public.create_listing(text, text, text, text, text, text[], text[], int, int, public.prompt_status, text, jsonb)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.app_settings enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_secrets enable row level security;
alter table public.prompt_examples enable row level security;
alter table public.purchases enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;
alter table public.test_runs enable row level security;

-- profiles
create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- categories / settings
create policy "Categories are public" on public.categories for select using (true);
create policy "Settings are public" on public.app_settings for select using (true);
create policy "Admins update settings" on public.app_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- prompts
create policy "Live prompts are public; owners and admins see all" on public.prompts for select
  using (status = 'live' or creator_id = (select auth.uid()) or public.is_admin());
create policy "Creators create own prompts" on public.prompts for insert to authenticated
  with check (creator_id = (select auth.uid()) and status in ('draft', 'pending'));
create policy "Creators update own prompts" on public.prompts for update to authenticated
  using (creator_id = (select auth.uid()) or public.is_admin())
  with check (creator_id = (select auth.uid()) or public.is_admin());
create policy "Creators and admins delete prompts" on public.prompts for delete to authenticated
  using (creator_id = (select auth.uid()) or public.is_admin());

-- prompt_secrets: only buyers, the creator, admins (and anyone signed in for free prompts)
create policy "Template visible with access" on public.prompt_secrets for select to authenticated
  using (public.has_prompt_access(prompt_id));
create policy "Creators write own template" on public.prompt_secrets for insert to authenticated
  with check (exists (select 1 from public.prompts p where p.id = prompt_id and p.creator_id = (select auth.uid())));
create policy "Creators update own template" on public.prompt_secrets for update to authenticated
  using (exists (select 1 from public.prompts p where p.id = prompt_id and p.creator_id = (select auth.uid())));

-- prompt_examples: visible whenever the prompt is
create policy "Examples follow prompt visibility" on public.prompt_examples for select
  using (exists (select 1 from public.prompts p where p.id = prompt_id));
create policy "Creators manage own examples" on public.prompt_examples for all to authenticated
  using (exists (select 1 from public.prompts p where p.id = prompt_id and p.creator_id = (select auth.uid())))
  with check (exists (select 1 from public.prompts p where p.id = prompt_id and p.creator_id = (select auth.uid())));

-- purchases: buyer, the prompt's creator, admins
create policy "Purchases visible to buyer, creator, admin" on public.purchases for select to authenticated
  using (
    buyer_id = (select auth.uid())
    or public.is_admin()
    or exists (select 1 from public.prompts p where p.id = prompt_id and p.creator_id = (select auth.uid()))
  );

-- reviews: public; only verified buyers write
create policy "Reviews are public" on public.reviews for select using (true);
create policy "Buyers review purchased prompts" on public.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.purchases pu
                where pu.prompt_id = reviews.prompt_id and pu.buyer_id = (select auth.uid()) and pu.status = 'paid')
  );
create policy "Users edit own reviews" on public.reviews for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users delete own reviews" on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- favorites
create policy "Users see own favorites" on public.favorites for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users add favorites" on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users remove favorites" on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));

-- reports
create policy "Users file reports" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
create policy "Reporters and admins see reports" on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_admin());
create policy "Admins update reports" on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- test_runs
create policy "Users see own test runs" on public.test_runs for select to authenticated
  using (user_id = (select auth.uid()));
