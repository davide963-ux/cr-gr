# ⚡ HashRush

Skill games → points → weekly leaderboard → **top 10 paid in $HASHRUSH (pump.fun / Solana) every Monday (manually)**.

Stack: **Next.js 15 (Vercel)** · **Neon Postgres** (`@neondatabase/serverless`) · Email magic-link signup (Resend). Prizes are sent **manually**.

## Architecture
```mermaid
flowchart LR
  U[Player] -->|HTTPS| V[Vercel: Next.js pages + API routes]
  V -->|DATABASE_URL pooled| N[(Neon Postgres)]
  Y[You, Monday] -->|npm run winners| N
  Y -->|DM winners on X, send tokens| W[Top 10 winners]
```

## Sign-up and login (passwordless, verified email)
Signup requires **email + X username** (`@name`, `x.com/name` or `name`). The X account is *not* connected, only stored so you can DM winners.
```mermaid
sequenceDiagram
  participant B as Browser
  participant A as API
  participant D as Neon
  participant M as Resend (email)
  B->>A: POST /api/auth/signup {email, xUsername}
  A->>D: validate, upsert UNVERIFIED player
  A->>D: store sha256(token), expires in 30 min
  A->>M: email link /verify?token=...
  B->>B: user opens link, clicks "Confirm" (POST, so email scanners can't burn it)
  B->>A: POST /api/auth/verify {token}
  A->>D: UPDATE token SET used_at WHERE unused AND not expired (single use)
  A->>D: mark email_verified_at
  A-->>B: httpOnly cookie, 30 days
```
- Only **verified** accounts can play or appear on the leaderboard. One account per email, one per verified X handle.
- Returning on a new device: "Log in" sends a new link (same flow, no password). Max 5 links/hour per account.
- X handles are not verified: someone could type another person's handle, so DM the winner and confirm before paying.

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
  Q --> T[table + CSV: rank, @handle, email, amount]
  T --> S[send tokens from your wallet]
  S --> R{want a record?}
  R -- yes --> REC[npm run winners -- --record, then UPDATE status/tx_signature]
  R -- no --> D[done]
```
Split (rank 1→10): 30/20/15/10/8/6/4/3/2/2 % of `WEEKLY_PRIZE_POOL` (edit `SPLIT` in `scripts/winners.ts`). Ties go to whoever reached their total first. Weeks run Mon 00:00 → Sun 23:59 UTC, so run the script any time after Monday 00:00 UTC.

## Setup
1. **Neon**: create project, copy the *pooled* connection string → `DATABASE_URL`. Run `psql "$DATABASE_URL" -f db/schema.sql` on a fresh DB.
2. **Resend**: create an account, verify your sending domain, create an API key → `RESEND_API_KEY`, `EMAIL_FROM`.
3. **Vercel**: import repo, set `DATABASE_URL`, `SESSION_SECRET` (random 32+ chars), `APP_URL` (your https URL), `RESEND_API_KEY`, `EMAIL_FROM`.
4. **Local**: copy `.env.example` to `.env.local`; `npm run dev` (without `RESEND_API_KEY` the login link is printed in the terminal). Tests: `npm test`. Weekly winners: `npm run winners`.
5. Launch the token on pump.fun and keep the prize tokens in your own wallet. No keys are stored in the app.

## Known limits / before going live
- Bots: click-timing checks only stop naive scripts. For real money consider Cloudflare Turnstile on `/game/start`, per-IP limits, and manual review of the top 10 before payout (set the DB rows, then run).
- Prize games may be regulated as gambling/promotions in some jurisdictions; keep it free-to-play and check local rules/ToS.
