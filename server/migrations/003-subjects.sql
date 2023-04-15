CREATE TABLE "subjects" (
  "id" INTEGER NOT NULL UNIQUE,
  "game_id" INTEGER NOT NULL,
  "round" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  PRIMARY KEY("id" AUTOINCREMENT)
);

-- "round" variants:
-- 0 - first
-- 1 - second
-- 2 - third
-- 3 - final
-- 4 - skirmish