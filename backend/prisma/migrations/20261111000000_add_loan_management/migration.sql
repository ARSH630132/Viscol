CREATE TYPE "LoanApplicationStatus" AS ENUM ('Submitted', 'UnderReview', 'Approved', 'Rejected');

CREATE TABLE "loan_providers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "provider_type" TEXT NOT NULL,
    "loan_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "interest_rate" TEXT NOT NULL,
    "maximum_amount" TEXT NOT NULL,
    "required_documents" TEXT[] NOT NULL,
    "process_details" TEXT NOT NULL,
    "contact_information" TEXT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loan_applications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider_id" INTEGER,
    "provider_name" TEXT NOT NULL,
    "loan_type" TEXT NOT NULL,
    "student_name" TEXT NOT NULL,
    "student_mobile" TEXT NOT NULL,
    "student_email" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "college_name" TEXT NOT NULL,
    "requested_amount" INTEGER NOT NULL,
    "co_borrower_name" TEXT NOT NULL,
    "co_borrower_relationship" TEXT NOT NULL,
    "message" TEXT,
    "status" "LoanApplicationStatus" NOT NULL DEFAULT 'Submitted',
    "admin_remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "loan_providers_is_visible_is_active_idx" ON "loan_providers"("is_visible", "is_active");
CREATE INDEX "loan_applications_user_id_created_at_idx" ON "loan_applications"("user_id", "created_at");
CREATE INDEX "loan_applications_provider_id_idx" ON "loan_applications"("provider_id");
CREATE INDEX "loan_applications_status_created_at_idx" ON "loan_applications"("status", "created_at");

ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "loan_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
