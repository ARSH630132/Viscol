ALTER TABLE "colleges"
ADD COLUMN "video_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "colleges"
SET "video_urls" = ARRAY["video_url"]
WHERE "video_url" IS NOT NULL AND "video_url" <> '';
