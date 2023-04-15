CREATE TABLE "questions" (
  "subject_id" INTEGER NOT NULL,
  "index" INTEGER NOT NULL,
  "question_type" INTEGER,
  "question" TEXT,
  "answer_type" INTEGER,
  "answer" TEXT,
  "comment" TEXT
);

-- "question_type" and "answer_type" variants:
-- 0 - text
-- 1 - image
-- 2 - audio
-- 3 - video