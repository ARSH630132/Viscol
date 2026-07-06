import { parse } from "csv-parse/sync";
import slugify from "slugify";
import xlsx from "xlsx";

import { prisma } from "../db.js";

const toNumber = (value, fallback = 0) => {
  const number = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : fallback;
};

const toBoolean = (value) => ["true", "yes", "1", "available"].includes(String(value ?? "").toLowerCase());

const toArray = (value) =>
  String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

export function parseCsv(buffer) {
  return parse(buffer.toString("utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

export function parseExcel(buffer) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet, { defval: "" });
}

export async function importCollegeRows(rows) {
  const results = [];

  for (const row of rows) {
    const name = row.name || row.college_name;
    if (!name) continue;

    const slug =
      row.slug ||
      slugify(name, {
        lower: true,
        strict: true,
      });

    const courseName = row.course_name || row.course || "B.Tech";
    const branchName = row.branch_name || row.branch || "Computer Science";
    const durationYears = toNumber(row.duration_years, courseName.toLowerCase().includes("mba") ? 2 : 4);
    const tuition = toNumber(row.tuition_fee_yearly || row.tuition_fee, 100000);
    const hostel = toNumber(row.hostel_fee_yearly || row.hostel_fee, 50000);
    const mess = toNumber(row.mess_fee_yearly || row.mess_fee, 30000);
    const exam = toNumber(row.exam_fee_yearly || row.exam_fee, 6000);
    const transport = toNumber(row.transport_fee_yearly || row.transport_fee, 10000);
    const other = toNumber(row.other_charges_yearly || row.other_charges, 8000);
    const totalAnnual = toNumber(row.total_annual_cost, tuition + hostel + mess + exam + transport + other);

    const college = await prisma.college.upsert({
      where: { slug },
      update: {
        name,
        description: row.description || "Career-focused college imported into College Visitor.",
        collegeType: row.college_type || "Private",
        state: row.state || "Uttar Pradesh",
        city: row.city || "Lucknow",
        address: row.address || `${row.city || "Lucknow"}, Uttar Pradesh`,
        pincode: String(row.pincode || "226001"),
        website: row.website || null,
        email: row.email || null,
        phone: row.phone ? String(row.phone) : null,
        establishedYear: toNumber(row.established_year, 2005),
        affiliation: row.affiliation || "State Technical University",
        approvals: toArray(row.approvals || "AICTE Approved|UGC Approved"),
        accreditations: toArray(row.accreditations || "NAAC Accredited"),
        rating: toNumber(row.rating, 4.1),
        logoUrl: row.logo_url || null,
        coverImageUrl: row.cover_image_url || "/images/campus-1.jpg",
        galleryImages: toArray(row.gallery_images || "/images/campus-1.jpg|/images/campus-2.jpg"),
        videoUrl: row.video_url || null,
      },
      create: {
        name,
        slug,
        description: row.description || "Career-focused college imported into College Visitor.",
        collegeType: row.college_type || "Private",
        state: row.state || "Uttar Pradesh",
        city: row.city || "Lucknow",
        address: row.address || `${row.city || "Lucknow"}, Uttar Pradesh`,
        pincode: String(row.pincode || "226001"),
        website: row.website || null,
        email: row.email || null,
        phone: row.phone ? String(row.phone) : null,
        establishedYear: toNumber(row.established_year, 2005),
        affiliation: row.affiliation || "State Technical University",
        approvals: toArray(row.approvals || "AICTE Approved|UGC Approved"),
        accreditations: toArray(row.accreditations || "NAAC Accredited"),
        rating: toNumber(row.rating, 4.1),
        logoUrl: row.logo_url || null,
        coverImageUrl: row.cover_image_url || "/images/campus-1.jpg",
        galleryImages: toArray(row.gallery_images || "/images/campus-1.jpg|/images/campus-2.jpg"),
        videoUrl: row.video_url || null,
      },
    });

    const course = await prisma.course.create({
      data: {
        collegeId: college.id,
        courseName,
        branchName,
        durationYears,
        eligibility: row.eligibility || "10+2 with PCM or equivalent qualification.",
        entranceExam: row.entrance_exam || "JEE Main / CUET / Direct Admission",
        seats: toNumber(row.seats, 120),
      },
    });

    await prisma.fee.create({
      data: {
        collegeId: college.id,
        courseId: course.id,
        tuitionFeeYearly: tuition,
        hostelFeeYearly: hostel,
        messFeeYearly: mess,
        examFeeYearly: exam,
        transportFeeYearly: transport,
        otherChargesYearly: other,
        totalAnnualCost: totalAnnual,
        totalCourseCost: toNumber(row.total_course_cost, totalAnnual * durationYears),
      },
    });

    await prisma.placement.create({
      data: {
        collegeId: college.id,
        courseId: course.id,
        averagePackage: toNumber(row.average_package, 4.5),
        highestPackage: toNumber(row.highest_package, 18),
        placementPercentage: toNumber(row.placement_percentage, 78),
        topRecruiters: toArray(row.top_recruiters || "TCS|Infosys|Wipro|HCL|Accenture"),
      },
    });

    await prisma.scholarship.create({
      data: {
        collegeId: college.id,
        title: row.scholarship_title || "Merit Scholarship",
        description: row.scholarship_description || "Scholarship for eligible meritorious students.",
        eligibility: row.scholarship_eligibility || "Based on academic score and admission criteria.",
        amount: toNumber(row.scholarship_amount, 25000),
        scholarshipAvailable: toBoolean(row.scholarship_available ?? true),
      },
    });

    results.push({ id: college.id, name: college.name, slug: college.slug });
  }

  return results;
}
