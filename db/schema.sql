-- HashRush schema for Neon Postgres. Apply with:  psql "$DATABASE_URL" -f db/schema.sql
-- The DB is only ever reached from server code (API routes / payout job) via DATABASE_URL.

create table players (
  wallet      text primary key,               -- Solana public key (base58)
  username    text,
  created_at  timestamptz not null default now()
);

create table auth_nonces (
  wallet      text primary key,
  nonce       text not null,
  expires_at  timestamptz not null
);

create table game_sessions (
  id           uuid primary key default gen_random_uuid(),
  wallet       text not null references players(wallet),
  game         text not null,
  seed         text not null,                  -- server secret; rounds derived from it
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  score        integer,
  won          boolean,
  points       integer not null default 0,    -- points credited to the leaderboard
  week_start   date not null                   -- Monday (UTC) of the week the points count for
);
create index on game_sessions (week_start, wallet);
create index on game_sessions (wallet, started_at);

create table weekly_payouts (
  id            bigint generated always as identity primary key,
  week_start    date not null,
  rank          int  not null check (rank between 1 and 10),
  wallet        text not null,
  points        int  not null,
  amount        numeric not null,              -- whole tokens
  status        text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  tx_signature  text,
  error         text,
  created_at    timestamptz not null default now(),
  unique (week_start, rank)                    -- makes the payout run idempotent
);

-- Weekly leaderboard: one query, used by the API and by the payout job.
create or replace function weekly_leaderboard(p_week date, p_limit int default 100)
returns table (rank bigint, wallet text, username text, points bigint, wins bigint)
language sql stable as $$
  select row_number() over (order by sum(g.points) desc, max(g.finished_at) asc) as rank,
         g.wallet, p.username, sum(g.points)::bigint, count(*) filter (where g.won)::bigint
  from game_sessions g join players p using (wallet)
  where g.week_start = p_week and g.finished_at is not null
  group by g.wallet, p.username
  having sum(g.points) > 0
  order by 1
  limit p_limit;
$$;
