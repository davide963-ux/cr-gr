import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | undefined;
/** Lazy so `next build` works without env vars. Use as a tagged template: sql`select …`. */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  _sql ??= neon(process.env.DATABASE_URL!);
  return _sql(strings, ...values) as Promise<Record<string, any>[]>;
}
