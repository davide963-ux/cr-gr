# ⚡ HashRush

Skill games → points → weekly leaderboard → **top 10 paid in $HASHRUSH (pump.fun / Solana) every Monday 00:05 UTC**.

Stack: **Next.js 15 (Vercel)** · **Neon Postgres** (`@neondatabase/serverless`) · Solana wallet login (Phantom) · Vercel Cron.

## Architecture
```mermaid
flowchart LR
  U[Player + Phantom] -->|HTTPS| V[Vercel: Next.js pages + API routes]
  V -->|DATABASE_URL pooled| N[(Neon Postgres)]
  C[Vercel Cron Mon 00:05 UTC] -->|Bearer CRON_SECRET| P[/api/cron/payout/]
  P --> N
  P -->|SPL transfer| S[Solana RPC] --> T[$HASHRUSH holders' wallets]
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
  B->>A: POST /api/auth/verify {wallet, signature}
  A->>D: DELETE nonce RETURNING (single use)
  A->>A: nacl.verify(signature, wallet pubkey)
  A-->>B: httpOnly JWT cookie (7d)
```

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

## Monday payout
```mermaid
flowchart TD
  T[Cron Mon 00:05 UTC] --> A{CRON_SECRET ok?}
  A -- no --> E[401]
  A -- yes --> LB[weekly_leaderboard previous week, top 10]
  LB --> DR{PAYOUT_DRY_RUN?}
  DR -- true --> PL[return plan only]
  DR -- false --> INS[INSERT weekly_payouts ON CONFLICT DO NOTHING]
  INS --> LOOP[for each pending/failed row]
  LOOP --> CL[claim: status = sending]
  CL --> TX[create recipient ATA, transferChecked]
  TX -- ok --> OK[status sent + tx signature]
  TX -- error --> FAIL[status failed, retried next run]
```
Split (rank 1→10): 30/20/15/10/8/6/4/3/2/2 % of `WEEKLY_PRIZE_POOL`. Ties are broken by who reached their total first.

## Setup
1. **Neon**: create project, copy the *pooled* connection string → `DATABASE_URL`. Then `psql "$DATABASE_URL" -f db/schema.sql`.
2. **pump.fun**: launch the token, put its mint in `HASHRUSH_MINT`. Fund a *dedicated* prize wallet with tokens (+ ~0.05 SOL for fees/ATA rent); its base58 secret → `TREASURY_SECRET_KEY`.
3. **Vercel**: import repo, set all vars from `.env.example` (`SESSION_SECRET`, `CRON_SECRET` = random 32+ chars). `vercel.json` registers the cron.
4. Keep `PAYOUT_DRY_RUN=true` until the dry-run plan in the cron response looks right, then set `false`.
5. Manual run: `npm run payout [YYYY-MM-DD]`. Dev: `npm run dev`; tests: `npm test`.

## Known limits / before going live
- Bots: click-timing checks only stop naive scripts. For real money consider Cloudflare Turnstile on `/game/start`, per-IP limits, and manual review of the top 10 before payout (set the DB rows, then run).
- The treasury key lives in a Vercel env var: use a wallet holding only ~1 week of prizes.
- A row stuck in `sending` (function crashed mid-transfer) is never auto-retried: check the chain, then fix the row by hand.
- Prize games may be regulated as gambling/promotions in some jurisdictions; keep it free-to-play and check local rules/ToS.
