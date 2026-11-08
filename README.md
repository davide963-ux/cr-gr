# ⚡ HashRush

Skill games → points → weekly leaderboard → **top 10 paid in $HASHRUSH (pump.fun / Solana) every Monday (manually)**.

Stack: **Next.js 15 (Vercel)** · **Neon Postgres** (`@neondatabase/serverless`) · Solana wallet login (Phantom). Prizes are sent **manually**.

## Architecture
```mermaid
flowchart LR
  U[Player + Phantom] -->|HTTPS| V[Vercel: Next.js pages + API routes]
  V -->|DATABASE_URL pooled| N[(Neon Postgres)]
  Y[You, Monday] -->|npm run winners| N
  Y -->|send tokens in Phantom/Solflare| W[Top 10 wallets]
```

## Login (no passwords – wallet signature)
```mermaid
sequenceDiagram
  participant B as Browser/Phantom
  participant A as API
  participant D as Neon
  B->>A: POST /api/auth/nonce {wallet}
  A->>D: upsert nonce (5 min TTL)
  A-->>B: message "Sign in…Nonce: x"
  B->>B: phantom.signMessage(message)
  B->>A: POST /api/auth/verify {wallet, signature, xUsername}
  A->>A: nacl.verify(signature, wallet pubkey)
  A->>D: new player? require valid X handle, insert
  A->>D: DELETE nonce RETURNING (single use)
  A-->>B: httpOnly JWT cookie (7d)
```

**X username:** required at first sign-in (`@name`, `x.com/name` or `name`; 1-15 letters/digits/underscore), stored in `players.x_username`, shown on the leaderboard and printed by `npm run winners` so you can DM winners. Handles are *not* verified: before paying, confirm via DM that the person controls both the X account and the wallet (otherwise someone can type another person's handle).

## One game (server-authoritative anti-cheat)
```mermaid
flowchart TD
  S[POST /game/start] --> L{<50 games today?}
  L -- no --> X[429]
  L -- yes --> SEED[random seed stored in DB, rounds = HMAC seed]
  SEED --> R[send rounds WITHOUT answers]
  R --> PLAY[30s play, client records clicks + timestamps]
  PLAY --> F[POST /game/finish clicks]
  F --> CHK{server replay: elapsed ≈ 30s, ≥250ms between clicks, in order?}
  CHK -- no --> ZERO[score 0, session burned]
  CHK -- yes --> SC[score = +10 correct / −5 wrong]
  SC --> W{score ≥ 100?}
  W -- yes --> PTS[points = score added to this week]
  W -- no --> NONE[0 points]
```
`finished_at is null` in the UPDATE guarantees a session is scored once.

## Monday routine (manual)
```mermaid
flowchart TD
  M[Monday] --> Q[npm run winners]
  Q --> T[table + CSV: rank, wallet, amount]
  T --> S[send tokens from your wallet]
  S --> R{want a record?}
  R -- yes --> REC[npm run winners -- --record, then UPDATE status/tx_signature]
  R -- no --> D[done]
```
Split (rank 1→10): 30/20/15/10/8/6/4/3/2/2 % of `WEEKLY_PRIZE_POOL` (edit `SPLIT` in `scripts/winners.ts`). Ties go to whoever reached their total first. Weeks run Mon 00:00 → Sun 23:59 UTC, so run the script any time after Monday 00:00 UTC.

## Setup
1. **Neon**: create project, copy the *pooled* connection string → `DATABASE_URL`. Then `psql "$DATABASE_URL" -f db/schema.sql`.
2. **Vercel**: import repo, set `DATABASE_URL` and `SESSION_SECRET` (random 32+ chars).
3. **Local** (`npm run dev`, `npm run winners`): copy `.env.example` to `.env.local`. Tests: `npm test`.
4. Launch the token on pump.fun and keep the prize tokens in your own wallet. No keys are stored in the app.

## Known limits / before going live
- Bots: click-timing checks only stop naive scripts. For real money consider Cloudflare Turnstile on `/game/start`, per-IP limits, and manual review of the top 10 before payout (set the DB rows, then run).
- Prize games may be regulated as gambling/promotions in some jurisdictions; keep it free-to-play and check local rules/ToS.
