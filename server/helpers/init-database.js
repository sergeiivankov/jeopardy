// After database initialization it instance and prepare/escape statements
// template helper set to global variables DB and SQL

import SQL from 'sql-template-strings';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

sqlite3.verbose();

export default async () => {
  const db = await open({
    filename: process.env.JEOPARDY_DATABASE,
    driver: sqlite3.Database
  });

  await db.migrate({ migrationsPath: './server/migrations' });

  globalThis.DB = db;
  globalThis.SQL = SQL;
};