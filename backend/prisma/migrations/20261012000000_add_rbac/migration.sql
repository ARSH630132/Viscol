CREATE TYPE "UserRole" AS ENUM ('Student', 'College', 'Admin');

ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'Student';
ALTER TABLE "colleges" ADD COLUMN "is_visible" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "college_accesses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "college_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "college_accesses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "college_accesses_user_id_college_id_key" ON "college_accesses"("user_id", "college_id");
CREATE INDEX "college_accesses_college_id_idx" ON "college_accesses"("college_id");

ALTER TABLE "college_accesses" ADD CONSTRAINT "college_accesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "college_accesses" ADD CONSTRAINT "college_accesses_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
