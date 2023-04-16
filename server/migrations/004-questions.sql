CREATE TABLE "questions" (
  "subject_id" INTEGER NOT NULL,
  "index" INTEGER NOT NULL,
  "question_type" INTEGER,
  "question" TEXT,
  "question_file" TEXT,
  "answer" TEXT,
  "comment" TEXT
);

-- "question_type" variants:
-- 0 - only text
-- 1 - image
-- 2 - audio
-- 3 - video