import pg, { QueryResultRow } from "pg";
import { config } from "../config.js";

function normalizePgConnectionString(connectionString: string) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return connectionString;
  }
}

export const pool = config.databaseUrl
  ? new pg.Pool({
      connectionString: normalizePgConnectionString(config.databaseUrl),
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    })
  : null;

if (pool) {
  pool.on("error", (err) => console.error("[DB] Pool error:", err.message));
}

export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return pool.query<T>(sql, params);
}

export function hasDatabase(): boolean {
  return pool !== null;
}
