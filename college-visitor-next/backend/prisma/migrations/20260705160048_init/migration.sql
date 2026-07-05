-- CreateEnum
CREATE TYPE "CollegeType" AS ENUM ('Government', 'Private', 'Deemed', 'Autonomous');

-- CreateTable
CREATE TABLE "colleges" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "college_type" "CollegeType" NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "established_year" INTEGER NOT NULL,
    "affiliation" TEXT NOT NULL,
    "approvals" TEXT[],
    "accreditations" TEXT[],
    "rating" DECIMAL(2,1) NOT NULL,
    "logo_url" TEXT,
    "cover_image_url" TEXT,
    "gallery_images" TEXT[],
    "video_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "course_name" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "duration_years" INTEGER NOT NULL,
    "eligibility" TEXT NOT NULL,
    "entrance_exam" TEXT,
    "seats" INTEGER NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fees" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "tuition_fee_yearly" INTEGER NOT NULL,
    "hostel_fee_yearly" INTEGER NOT NULL,
    "mess_fee_yearly" INTEGER NOT NULL,
    "exam_fee_yearly" INTEGER NOT NULL,
    "transport_fee_yearly" INTEGER NOT NULL,
    "other_charges_yearly" INTEGER NOT NULL,
    "total_annual_cost" INTEGER NOT NULL,
    "total_course_cost" INTEGER NOT NULL,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placements" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "average_package" DECIMAL(5,2) NOT NULL,
    "highest_package" DECIMAL(5,2) NOT NULL,
    "placement_percentage" DECIMAL(5,2) NOT NULL,
    "top_recruiters" TEXT[],

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "scholarship_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "boys_hostel_available" BOOLEAN NOT NULL DEFAULT false,
    "girls_hostel_available" BOOLEAN NOT NULL DEFAULT false,
    "room_types" TEXT[],
    "facilities" TEXT[],
    "yearly_fee" INTEGER NOT NULL,

    CONSTRAINT "hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "student_name" TEXT NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "academics_rating" DECIMAL(2,1) NOT NULL,
    "placement_rating" DECIMAL(2,1) NOT NULL,
    "hostel_rating" DECIMAL(2,1) NOT NULL,
    "campus_rating" DECIMAL(2,1) NOT NULL,
    "review_text" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "student_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "preferred_college_id" INTEGER,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compare_history" (
    "id" SERIAL NOT NULL,
    "college_ids" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compare_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ComparedColleges" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ComparedColleges_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "colleges_slug_key" ON "colleges"("slug");

-- CreateIndex
CREATE INDEX "colleges_city_idx" ON "colleges"("city");

-- CreateIndex
CREATE INDEX "colleges_state_idx" ON "colleges"("state");

-- CreateIndex
CREATE INDEX "colleges_college_type_idx" ON "colleges"("college_type");

-- CreateIndex
CREATE INDEX "courses_course_name_idx" ON "courses"("course_name");

-- CreateIndex
CREATE INDEX "courses_branch_name_idx" ON "courses"("branch_name");

-- CreateIndex
CREATE INDEX "fees_total_annual_cost_idx" ON "fees"("total_annual_cost");

-- CreateIndex
CREATE INDEX "placements_average_package_idx" ON "placements"("average_package");

-- CreateIndex
CREATE INDEX "placements_placement_percentage_idx" ON "placements"("placement_percentage");

-- CreateIndex
CREATE INDEX "scholarships_scholarship_available_idx" ON "scholarships"("scholarship_available");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_college_id_key" ON "hostel"("college_id");

-- CreateIndex
CREATE INDEX "applications_created_at_idx" ON "applications"("created_at");

-- CreateIndex
CREATE INDEX "compare_history_created_at_idx" ON "compare_history"("created_at");

-- CreateIndex
CREATE INDEX "_ComparedColleges_B_index" ON "_ComparedColleges"("B");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel" ADD CONSTRAINT "hostel_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_preferred_college_id_fkey" FOREIGN KEY ("preferred_college_id") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComparedColleges" ADD CONSTRAINT "_ComparedColleges_A_fkey" FOREIGN KEY ("A") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComparedColleges" ADD CONSTRAINT "_ComparedColleges_B_fkey" FOREIGN KEY ("B") REFERENCES "compare_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
