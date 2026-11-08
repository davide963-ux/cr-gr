import { neon } from "@neondatabase/serverless";
import { SCHEMA } from "./schema";

type Q = ReturnType<typeof neon>;
let _sql: Q | undefined;
let _ready: Promise<void> | undefined;

/** Creates missing tables/functions once per server instance (all statements are idempotent). */
function ensureSchema(q: Q): Promise<void> {
  _ready ??= (async () => {
    for (const stmt of SCHEMA) await q(stmt);
  })().catch((e) => { _ready = undefined; throw e; });
  return _ready;
}

/** Tagged template: sql`select …`. Lazy, so `next build` works without env vars. */
export async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  _sql ??= neon(process.env.DATABASE_URL!);
  await ensureSchema(_sql);
  return (await _sql(strings, ...values)) as Record<string, any>[];
}
