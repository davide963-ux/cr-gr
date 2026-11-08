-- HashRush schema for Neon Postgres. Apply on a FRESH database with:
--   psql "$DATABASE_URL" -f db/schema.sql
-- Only ever reached from server code via DATABASE_URL.

create table players (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null check (email = lower(email)),
  x_username         text not null check (x_username ~ '^[A-Za-z0-9_]{1,15}$'),  -- winners are contacted here (not linked to X)
  email_verified_at  timestamptz,
  created_at         timestamptz not null default now()
);
-- one account per verified email / verified X handle; unverified rows can't squat names
create unique index players_email_key on players (email);
create unique index players_x_verified_key on players (lower(x_username)) where email_verified_at is not null;

-- magic-link tokens (only the sha256 hash is stored)
create table email_tokens (
  token_hash  text primary key,
  player_id   uuid not null references players(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz
);
create index on email_tokens (player_id, created_at);

create table game_sessions (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid not null references players(id),
  game         text not null,
  seed         text not null,                  -- server secret; rounds derived from it
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  score        integer,
  won          boolean,
  points       integer not null default 0,    -- points credited to the leaderboard
  week_start   date not null                   -- Monday (UTC) of the week the points count for
);
create index on game_sessions (week_start, player_id);
create index on game_sessions (player_id, started_at);

-- Optional manual record of prizes you sent (see `npm run winners -- --record`)
create table weekly_payouts (
  id            bigint generated always as identity primary key,
  week_start    date not null,
  rank          int  not null check (rank between 1 and 10),
  player_id     uuid not null references players(id),
  points        int  not null,
  amount        numeric not null,              -- whole tokens
  status        text not null default 'pending' check (status in ('pending','sent')),
  tx_signature  text,
  created_at    timestamptz not null default now(),
  unique (week_start, rank)
);

create or replace function weekly_leaderboard(p_week date, p_limit int default 100)
returns table (rank bigint, player_id uuid, x_username text, points bigint, wins bigint)
language sql stable as $$
  select row_number() over (order by sum(g.points) desc, max(g.finished_at) asc) as rank,
         p.id, p.x_username, sum(g.points)::bigint, count(*) filter (where g.won)::bigint
  from game_sessions g join players p on p.id = g.player_id
  where g.week_start = p_week and g.finished_at is not null and p.email_verified_at is not null
  group by p.id, p.x_username
  having sum(g.points) > 0
  order by 1
  limit p_limit;
$$;
