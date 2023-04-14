import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

sqlite3.verbose();

let db;

const initDbConnection = async () => {
  db = await open({
    filename: 'jeopardy.db',
    driver: sqlite3.Database
  });

  await db.migrate({ migrationsPath: './server/migrations' });
};

export {
  initDbConnection,
  db as default
};