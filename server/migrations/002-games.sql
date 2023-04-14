CREATE TABLE "games" (
  "id" INTEGER NOT NULL UNIQUE,
  "owner_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "announced" INTEGER NOT NULL,
  "state" TEXT,
  PRIMARY KEY("id" AUTOINCREMENT)
);

-- "announced" variants
-- 0 - not announced
-- 1 - announced