// One-off: apply supabase/migrations/014_trip_planner.sql to the database.
// Reads the connection URI from env PGURI and parses it manually so passwords
// containing literal % (invalid in a URL) are handled correctly. Prints no
// secrets.
import { readFileSync } from 'node:fs';
import pg from 'pg';

const uri = process.env.PGURI;
if (!uri) {
  console.error('PGURI not set');
  process.exit(1);
}

const m = uri.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/]+):(\d+)\/(.+)$/);
if (!m) {
  console.error('Could not parse connection URI');
  process.exit(1);
}
const [, user, password, host, port, database] = m;
console.log(`Connecting to ${host}:${port}/${database} as ${user}…`);

const sql = readFileSync(new URL('../supabase/migrations/014_trip_planner.sql', import.meta.url), 'utf8');

const client = new pg.Client({
  user,
  password,
  host,
  port: Number(port),
  database,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

try {
  await client.connect();
  await client.query(sql);
  // Verify the tables now exist.
  const { rows } = await client.query(
    `select table_name from information_schema.tables
     where table_schema='public' and table_name like 'trip_%' order by table_name`,
  );
  console.log('OK — migration applied. trip_* tables:', rows.map((r) => r.table_name).join(', '));
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
