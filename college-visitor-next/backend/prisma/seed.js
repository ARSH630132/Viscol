import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

const images = [
  "/images/campus-1.jpg",
  "/images/campus-2.jpg",
  "/images/campus-3.jpg",
  "/images/campus-4.jpg",
  "/images/campus-5.jpg",
  "/images/campus-6.jpg",
];

const colleges = [
  {
    name: "RR Group of Institutions",
    short: "RRGI",
    city: "Lucknow",
    address: "Bakshi Ka Talab, Lucknow",
    pincode: "226201",
    type: "Private",
    rating: 4.2,
    established: 2008,
    annual: 125000,
    avg: 3.8,
    highest: 12.5,
    placement: 78,
  },
  {
    name: "Shri Ramswaroop Memorial University",
    short: "SRMU",
    city: "Barabanki",
    address: "Lucknow-Deva Road, Barabanki",
    pincode: "225003",
    type: "Private",
    rating: 4.3,
    established: 2012,
    annual: 150000,
    avg: 4.3,
    highest: 16.0,
    placement: 81,
  },
  {
    name: "Babu Banarasi Das University",
    short: "BBD",
    city: "Lucknow",
    address: "Faizabad Road, Lucknow",
    pincode: "226028",
    type: "Private",
    rating: 4.1,
    established: 2010,
    annual: 190000,
    avg: 4.9,
    highest: 21.0,
    placement: 76,
  },
  {
    name: "Integral University",
    short: "IU",
    city: "Lucknow",
    address: "Kursi Road, Lucknow",
    pincode: "226026",
    type: "Private",
    rating: 4.0,
    established: 2004,
    annual: 220000,
    avg: 5.5,
    highest: 24.0,
    placement: 85,
  },
  {
    name: "Amity University Lucknow",
    short: "AUL",
    city: "Lucknow",
    address: "Malhaur, Gomti Nagar Extension, Lucknow",
    pincode: "226028",
    type: "Private",
    rating: 4.4,
    established: 2004,
    annual: 260000,
    avg: 5.8,
    highest: 30.0,
    placement: 84,
  },
  {
    name: "Goel Institute of Technology and Management",
    short: "GITM",
    city: "Lucknow",
    address: "Faizabad Road, Lucknow",
    pincode: "226028",
    type: "Private",
    rating: 3.9,
    established: 2008,
    annual: 118000,
    avg: 3.6,
    highest: 9.5,
    placement: 70,
  },
  {
    name: "School of Management Sciences Lucknow",
    short: "SMS",
    city: "Lucknow",
    address: "Sultanpur Road, Lucknow",
    pincode: "226501",
    type: "Autonomous",
    rating: 4.1,
    established: 2008,
    annual: 135000,
    avg: 4.0,
    highest: 13.0,
    placement: 75,
  },
  {
    name: "GL Bajaj Institute of Technology and Management",
    short: "GLBITM",
    city: "Greater Noida",
    address: "Knowledge Park III, Greater Noida",
    pincode: "201306",
    type: "Private",
    rating: 4.5,
    established: 2005,
    annual: 235000,
    avg: 6.2,
    highest: 40.0,
    placement: 88,
  },
  {
    name: "Galgotias University",
    short: "GU",
    city: "Greater Noida",
    address: "Yamuna Expressway, Greater Noida",
    pincode: "203201",
    type: "Private",
    rating: 4.3,
    established: 2011,
    annual: 245000,
    avg: 5.9,
    highest: 35.0,
    placement: 86,
  },
  {
    name: "Sharda University",
    short: "SU",
    city: "Greater Noida",
    address: "Knowledge Park III, Greater Noida",
    pincode: "201310",
    type: "Private",
    rating: 4.2,
    established: 2009,
    annual: 270000,
    avg: 6.0,
    highest: 45.0,
    placement: 83,
  },
];

const courseTemplates = [
  { courseName: "B.Tech", branchName: "Computer Science and Engineering", years: 4, seats: 180 },
  { courseName: "MBA", branchName: "Finance and Marketing", years: 2, seats: 120 },
];

async function main() {
  await prisma.compareHistory.deleteMany();
  await prisma.application.deleteMany();
  await prisma.review.deleteMany();
  await prisma.hostel.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.placement.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.course.deleteMany();
  await prisma.college.deleteMany();

  for (const [index, item] of colleges.entries()) {
    const college = await prisma.college.create({
      data: {
        name: item.name,
        slug: `${slugify(item.name, { lower: true, strict: true })}-${index + 1}`,
        description: `${item.name} is a career-oriented institution offering professional education, placement support, scholarships, hostel facilities, and admission guidance for students in Uttar Pradesh and NCR.`,
        collegeType: item.type,
        state: "Uttar Pradesh",
        city: item.city,
        address: item.address,
        pincode: item.pincode,
        website: `https://www.${item.short.toLowerCase()}.edu.in`,
        email: `admissions@${item.short.toLowerCase()}.edu.in`,
        phone: `+91-522-40${String(1000 + index)}`,
        establishedYear: item.established,
        affiliation: index % 3 === 0 ? "Dr. A.P.J. Abdul Kalam Technical University" : "State Private University",
        approvals: ["AICTE Approved", "UGC Approved"],
        accreditations: index % 2 === 0 ? ["NAAC Accredited", "NBA Accredited"] : ["NAAC Accredited"],
        rating: item.rating,
        logoUrl: null,
        coverImageUrl: images[index % images.length],
        galleryImages: [images[index % images.length], images[(index + 1) % images.length], images[(index + 2) % images.length]],
        videoUrl: `https://www.youtube.com/watch?v=college-${index + 1}`,
      },
    });

    for (const [courseIndex, template] of courseTemplates.entries()) {
      const annualCost = item.annual + courseIndex * 45000;
      const tuition = Math.round(annualCost * 0.58);
      const hostel = Math.round(annualCost * 0.18);
      const mess = Math.round(annualCost * 0.11);
      const exam = 6500 + index * 200;
      const transport = 10000 + index * 500;
      const other = annualCost - tuition - hostel - mess - exam - transport;

      const course = await prisma.course.create({
        data: {
          collegeId: college.id,
          courseName: template.courseName,
          branchName: template.branchName,
          durationYears: template.years,
          eligibility:
            template.courseName === "B.Tech"
              ? "10+2 with Physics, Chemistry, Mathematics and valid entrance/direct admission eligibility."
              : "Graduation in any stream with university admission criteria.",
          entranceExam: template.courseName === "B.Tech" ? "JEE Main / CUET / Direct Admission" : "CAT / MAT / CUET PG / Direct Admission",
          seats: template.seats,
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
          totalAnnualCost: annualCost,
          totalCourseCost: annualCost * template.years,
        },
      });

      await prisma.placement.create({
        data: {
          collegeId: college.id,
          courseId: course.id,
          averagePackage: item.avg + courseIndex * 0.3,
          highestPackage: item.highest + courseIndex * 2,
          placementPercentage: Math.min(item.placement + courseIndex * 2, 95),
          topRecruiters: ["TCS", "Infosys", "Wipro", "HCL", "Accenture", "Cognizant", "Deloitte"].slice(0, 5 + (index % 3)),
        },
      });
    }

    await prisma.hostel.create({
      data: {
        collegeId: college.id,
        boysHostelAvailable: true,
        girlsHostelAvailable: true,
        roomTypes: ["Single Sharing", "Double Sharing", "Triple Sharing"],
        facilities: ["WiFi", "Laundry", "Mess", "Security", "Sports", "Medical Support"],
        yearlyFee: Math.round(item.annual * 0.22),
      },
    });

    await prisma.scholarship.createMany({
      data: [
        {
          collegeId: college.id,
          title: "Merit Scholarship",
          description: "Fee waiver for students with strong academic performance.",
          eligibility: "Based on Class 12 or graduation marks and entrance performance.",
          amount: 25000 + index * 2500,
          scholarshipAvailable: true,
        },
        {
          collegeId: college.id,
          title: "Need-Based Financial Aid",
          description: "Support for eligible students from value-conscious families.",
          eligibility: "Income certificate and academic documents required.",
          amount: 15000 + index * 1500,
          scholarshipAvailable: index % 2 === 0,
        },
      ],
    });

    await prisma.review.createMany({
      data: [
        {
          collegeId: college.id,
          studentName: "Aarav Singh",
          rating: item.rating,
          academicsRating: 4.1,
          placementRating: Math.min(item.rating + 0.1, 5),
          hostelRating: 3.9,
          campusRating: 4.2,
          reviewText: "Good academics, supportive faculty, and a helpful placement team for serious students.",
        },
        {
          collegeId: college.id,
          studentName: "Priya Mishra",
          rating: Math.max(item.rating - 0.1, 3.5),
          academicsRating: 4.0,
          placementRating: 4.0,
          hostelRating: 4.1,
          campusRating: 4.0,
          reviewText: "Campus life is balanced and scholarship support helped reduce the overall cost.",
        },
      ],
    });
  }

  console.log(`Seeded ${colleges.length} colleges with courses, fees, placements, scholarships, hostel and reviews.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
