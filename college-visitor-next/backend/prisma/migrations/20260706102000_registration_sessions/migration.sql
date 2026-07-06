-- Drop old OTP storage from the previous auth approach.
DROP TABLE IF EXISTS "otps";

-- Move phone-based auth field to the new mobile field.
DROP INDEX IF EXISTS "users_phone_key";
ALTER TABLE "users" RENAME COLUMN "phone" TO "mobile";

-- Keep existing development rows migratable before adding required constraints.
UPDATE "users"
SET "name" = COALESCE(NULLIF("name", ''), 'Student')
WHERE "name" IS NULL OR "name" = '';

UPDATE "users"
SET "email" = COALESCE("email", CONCAT('student', "id", '@collegevisitor.local'))
WHERE "email" IS NULL;

UPDATE "users"
SET "mobile" = COALESCE("mobile", CONCAT('900000', LPAD("id"::text, 4, '0')))
WHERE "mobile" IS NULL;

ALTER TABLE "users" ADD COLUMN "last_login" TIMESTAMP(3);
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "mobile" SET NOT NULL;

CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
