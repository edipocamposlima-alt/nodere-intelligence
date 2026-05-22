import pg from "pg";
import { config } from "../config.js";

export const pool = config.databaseUrl
  ? new pg.Pool({
      connectionString: config.databaseUrl
    })
  : null;

export async function query<T>(sql: string, params: unknown[] = []) {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const result = await pool.query<T>(sql, params);
  return result;
}
