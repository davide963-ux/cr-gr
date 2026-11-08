-- HashRush schema (idempotent). The app also applies this automatically on first DB use (src/lib/schema.ts).
-- Manual run, if you want: paste into the Neon SQL Editor of the DB that DATABASE_URL points to.

create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  x_username  text not null check (x_username ~ '^[A-Za-z0-9_]{1,15}$'),
  created_at  timestamptz not null default now()
);

create unique index if not exists players_x_username_key on players (lower(x_username));

create table if not exists game_sessions (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid not null references players(id),
  game         text not null,
  seed         text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  score        integer,
  won          boolean,
  points       integer not null default 0,
  week_start   date not null
);

create index if not exists game_sessions_week_idx on game_sessions (week_start, player_id);

create index if not exists game_sessions_player_idx on game_sessions (player_id, started_at);

create table if not exists weekly_payouts (
  id            bigint generated always as identity primary key,
  week_start    date not null,
  rank          int  not null check (rank between 1 and 10),
  x_username    text not null,
  points        int  not null,
  amount        numeric not null,
  status        text not null default 'pending' check (status in ('pending','sent')),
  tx_signature  text,
  created_at    timestamptz not null default now(),
  unique (week_start, rank)
);

create or replace function weekly_leaderboard(p_week date, p_limit int default 100)
returns table (rank bigint, x_username text, points bigint, wins bigint)
language sql stable as $$
  select row_number() over (order by sum(g.points) desc, max(g.finished_at) asc) as rank,
         p.x_username, sum(g.points)::bigint, count(*) filter (where g.won)::bigint
  from game_sessions g join players p on p.id = g.player_id
  where g.week_start = p_week and g.finished_at is not null
  group by p.id, p.x_username
  having sum(g.points) > 0
  order by 1
  limit p_limit
$$;
