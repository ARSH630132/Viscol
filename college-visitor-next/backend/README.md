# College Visitor Backend

Express + PostgreSQL + Prisma backend for the College Visitor frontend.

## Features

- REST APIs for colleges, details, compare, applications, CSV import, and Excel import
- PostgreSQL schema with Prisma ORM
- Filtering, sorting, pagination, and search
- Request validation with Zod
- Centralized error handling
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
