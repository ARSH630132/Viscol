# College Visitor Backend

Express + PostgreSQL + Prisma backend for the College Visitor frontend.

## Features

- REST APIs for colleges, details, compare, applications, CSV import, and Excel import
- Role-restricted education loan providers and applications
- PostgreSQL schema with Prisma ORM
- Filtering, sorting, pagination, and search
- Request validation with Zod
- Centralized error handling
- College-advising chat assistant with Gemini and local fallback responses
- CSV and Excel import through `multipart/form-data`
- Seed data for 10 UP/NCR colleges

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create environment file:

```bash
copy .env.example .env
```

3. Update `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/college_visitor?schema=public"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="college-media"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_PUBLIC_BASE_URL="https://media.example.com"
```

S3-compatible storage settings enable admin image and video uploads. For Cloudflare R2, configure a public bucket URL or custom domain as `S3_PUBLIC_BASE_URL`; the backend stores uploads under `college-media/`. Supported files are JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, and MOV, up to 100 MB per file.

The site-wide Viscol Assistant is available through the chat button in the lower-right corner. Configure `GEMINI_API_KEY` to enable Gemini responses. Without it, the assistant uses local college search and guidance responses.

After updating an existing database, deploy pending migrations and regenerate the Prisma client:

```bash
npx prisma migrate deploy
npm run prisma:generate
```

4. Create database in PostgreSQL:

```sql
CREATE DATABASE college_visitor;
```

5. Run Prisma migration and generate client:

```bash
npm run prisma:migrate
npm run prisma:generate
```

6. Seed dummy data:

```bash
npm run db:seed
```

7. Start API:

```bash
npm run dev
```

API runs at:

```txt
http://localhost:4000
```

Health check:

```txt
GET /health
```

## API Endpoints

### List Colleges

```txt
GET /api/colleges
```

Query filters:

- `course`
- `state`
- `city`
- `min_budget`
- `max_budget`
- `college_type`
- `placement_min`
- `scholarship=true`
- `sort_by`
- `search`
- `page`
- `limit`

Sorting values:

- `recommended`
- `fees_low_to_high`
- `fees_high_to_low`
- `placement_high_to_low`
- `rating_high_to_low`
- `lowest_total_cost`

Example:

```txt
GET /api/colleges?course=B.Tech&city=Lucknow&max_budget=200000&placement_min=4&scholarship=true&sort_by=fees_low_to_high&page=1&limit=10
```

### College Detail

```txt
GET /api/colleges/:slug
```

### Chat Assistant

```txt
POST /api/chat
Content-Type: application/json
```

Send a `messages` array containing `role` (`user` or `assistant`) and `content` fields.

### Compare Colleges

```txt
GET /api/compare?ids=1,2,3
```

This also records a `compare_history` row.

### Submit Application

```txt
POST /api/applications
Content-Type: application/json
```

Body:

```json
{
  "student_name": "Aarav Singh",
  "phone": "9876543210",
  "email": "aarav@example.com",
  "course": "B.Tech",
  "city": "Lucknow",
  "budget": 200000,
  "preferred_college_id": 1,
  "message": "Interested in admission support."
}
```

### Education Loans

Student and Admin accounts can view active providers using `GET /api/loans/providers`, submit an application using `POST /api/loans/applications`, and view their own applications using `GET /api/loans/applications`. The applicant's name and contact details are taken from the authenticated account.

Admin-only loan management endpoints:

- `GET`, `POST /api/admin/loan-providers`
- `PATCH`, `DELETE /api/admin/loan-providers/:id` (DELETE deactivates the provider and retains its application history)
- `GET /api/admin/loan-applications`
- `PATCH /api/admin/loan-applications/:id` to update status and admin notes

College accounts cannot access these endpoints. Apply database changes in each environment with `npx prisma migrate deploy` before serving the updated API.

To sync loan applications to Google Sheets without changing the existing application-sheet integration:

1. Create a separate Apps Script project (do not replace the script used by `/api/applications`) and paste `google-apps-script/LoanSync.gs`.
2. In the Apps Script project settings, add script properties `LOAN_SPREADSHEET_ID`, `LOAN_SYNC_SECRET`, `LOAN_APPLICATIONS_SHEET_NAME` (`Loan Applications`), and `LOAN_STATUS_HISTORY_SHEET_NAME` (`Loan Status History`). Use a long random secret; do not put it in source code or share it publicly.
3. Deploy the new project as a web app that executes as the owner. The endpoint can be publicly reachable because every request is checked against the secret; keep the secret only in Apps Script project properties and the backend secret environment.
4. Set the deployment URL as `GOOGLE_APPS_SCRIPT_LOAN_URL` and the same secret as `GOOGLE_APPS_SCRIPT_LOAN_SECRET` in the backend environment, then restart/redeploy the backend.

The script updates each application by its database ID and records each submission/status event once in the history tab. Student/admin UI reports when PostgreSQL saved an application/status but the Sheet sync failed. Student-provided text is written as literal cell text to prevent formula injection.

### CSV Import

```txt
POST /api/import/csv
Content-Type: multipart/form-data
field: file
```

### Excel Import

```txt
POST /api/import/excel
Content-Type: multipart/form-data
field: file
```

## Import Columns

CSV/Excel accepts these columns. Most are optional and have defaults.

```txt
name, slug, description, college_type, state, city, address, pincode,
website, email, phone, established_year, affiliation, approvals,
accreditations, rating, logo_url, cover_image_url, gallery_images,
video_url, course_name, branch_name, duration_years, eligibility,
entrance_exam, seats, tuition_fee_yearly, hostel_fee_yearly,
mess_fee_yearly, exam_fee_yearly, transport_fee_yearly,
other_charges_yearly, total_annual_cost, total_course_cost,
average_package, highest_package, placement_percentage, top_recruiters,
scholarship_title, scholarship_description, scholarship_eligibility,
scholarship_amount, scholarship_available
```

Use `|` to separate list values:

```txt
approvals = AICTE Approved|UGC Approved
gallery_images = /images/campus-1.jpg|/images/campus-2.jpg
top_recruiters = TCS|Infosys|Wipro
```

## Frontend Connection

Set an API base URL in your frontend environment when you are ready to connect:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

Then call:

```ts
fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/colleges`)
```

The current frontend was not changed by this backend setup.

## Seeded Colleges

- RR Group of Institutions
- Shri Ramswaroop Memorial University
- Babu Banarasi Das University
- Integral University
- Amity University Lucknow
- Goel Institute of Technology and Management
- School of Management Sciences Lucknow
- GL Bajaj Institute of Technology and Management
- Galgotias University
- Sharda University
