import { prisma } from "../db.js";

const collegeInclude = {
  courses: {
    include: {
      fees: true,
      placements: true,
    },
  },
  fees: true,
  hostel: true,
  placements: true,
  reviews: true,
  scholarships: true,
};

export function toApiCollege(college) {
  if (!college) return null;
  return {
    id: college.id,
    name: college.name,
    slug: college.slug,
    description: college.description,
    college_type: college.collegeType,
    state: college.state,
    city: college.city,
    address: college.address,
    pincode: college.pincode,
    website: college.website,
    email: college.email,
    phone: college.phone,
    established_year: college.establishedYear,
    affiliation: college.affiliation,
    approvals: college.approvals,
    accreditations: college.accreditations,
    rating: Number(college.rating),
    logo_url: college.logoUrl,
    cover_image_url: college.coverImageUrl,
    gallery_images: college.galleryImages,
    video_url: college.videoUrl,
    video_urls: college.videoUrls?.length ? college.videoUrls : college.videoUrl ? [college.videoUrl] : [],
    courses: college.courses?.map((course) => ({
      id: course.id,
      college_id: course.collegeId,
      course_name: course.courseName,
      branch_name: course.branchName,
      duration_years: course.durationYears,
      eligibility: course.eligibility,
      entrance_exam: course.entranceExam,
      seats: course.seats,
      fees: course.fees?.map(toApiFee),
      placements: course.placements?.map(toApiPlacement),
    })),
    fees: college.fees?.map(toApiFee),
    placements: college.placements?.map(toApiPlacement),
    scholarships: college.scholarships?.map((item) => ({
      id: item.id,
      college_id: item.collegeId,
      title: item.title,
      description: item.description,
      eligibility: item.eligibility,
      amount: item.amount,
      scholarship_available: item.scholarshipAvailable,
    })),
    hostel: college.hostel
      ? {
          id: college.hostel.id,
          college_id: college.hostel.collegeId,
          boys_hostel_available: college.hostel.boysHostelAvailable,
          girls_hostel_available: college.hostel.girlsHostelAvailable,
          room_types: college.hostel.roomTypes,
          facilities: college.hostel.facilities,
          yearly_fee: college.hostel.yearlyFee,
        }
      : null,
    reviews: college.reviews?.map((review) => ({
      id: review.id,
      college_id: review.collegeId,
      student_name: review.studentName,
      rating: Number(review.rating),
      academics_rating: Number(review.academicsRating),
      placement_rating: Number(review.placementRating),
      hostel_rating: Number(review.hostelRating),
      campus_rating: Number(review.campusRating),
      review_text: review.reviewText,
    })),
  };
}

export async function hydrateCollegeVideos(colleges) {
  if (!colleges.length) return colleges;
  const ids = colleges.map((college) => college.id);
  const rows = await prisma.$queryRaw`
    SELECT id, video_urls
    FROM colleges
    WHERE id = ANY(${ids})
  `;
  const videosByCollegeId = new Map(rows.map((row) => [row.id, row.video_urls]));
  return colleges.map((college) => ({
    ...college,
    videoUrls: videosByCollegeId.get(college.id) || [],
  }));
}

function toApiFee(fee) {
  return {
    id: fee.id,
    college_id: fee.collegeId,
    course_id: fee.courseId,
    tuition_fee_yearly: fee.tuitionFeeYearly,
    hostel_fee_yearly: fee.hostelFeeYearly,
    mess_fee_yearly: fee.messFeeYearly,
    exam_fee_yearly: fee.examFeeYearly,
    transport_fee_yearly: fee.transportFeeYearly,
    other_charges_yearly: fee.otherChargesYearly,
    total_annual_cost: fee.totalAnnualCost,
    total_course_cost: fee.totalCourseCost,
  };
}

function toApiPlacement(placement) {
  return {
    id: placement.id,
    college_id: placement.collegeId,
    course_id: placement.courseId,
    average_package: Number(placement.averagePackage),
    highest_package: Number(placement.highestPackage),
    placement_percentage: Number(placement.placementPercentage),
    top_recruiters: placement.topRecruiters,
  };
}

export async function listColleges(query) {
  const page = Math.max(query.page || 1, 1);
  const limit = Math.min(Math.max(query.limit || 12, 1), 50);
  const skip = (page - 1) * limit;

  const visibleRows = await prisma.$queryRaw`SELECT id FROM colleges WHERE is_visible = true`;
  const where = { id: { in: visibleRows.map((row) => row.id) } };
  const and = [];

  if (query.state) where.state = { equals: query.state, mode: "insensitive" };
  if (query.city) where.city = { equals: query.city, mode: "insensitive" };
  if (query.college_type) where.collegeType = query.college_type;

  if (query.course) {
    and.push({
      courses: {
        some: {
          OR: [
            { courseName: { contains: query.course, mode: "insensitive" } },
            { branchName: { contains: query.course, mode: "insensitive" } },
          ],
        },
      },
    });
  }

  if (query.min_budget !== undefined || query.max_budget !== undefined) {
    and.push({
      fees: {
        some: {
          totalAnnualCost: {
            gte: query.min_budget,
            lte: query.max_budget,
          },
        },
      },
    });
  }

  if (query.placement_min !== undefined) {
    and.push({
      placements: {
        some: {
          averagePackage: {
            gte: query.placement_min,
          },
        },
      },
    });
  }

  if (query.scholarship === true) {
    and.push({
      scholarships: {
        some: {
          scholarshipAvailable: true,
        },
      },
    });
  }

  if (query.search) {
    and.push({
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { city: { contains: query.search, mode: "insensitive" } },
        {
          courses: {
            some: {
              OR: [
                { courseName: { contains: query.search, mode: "insensitive" } },
                { branchName: { contains: query.search, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  if (and.length) where.AND = and;

  const colleges = await prisma.college.findMany({
    where,
    include: collegeInclude,
  });

  const total = colleges.length;
  const sorted = sortCollegeResults(colleges, query.sort_by);
  const pageData = sorted.slice(skip, skip + limit);
  const hydratedPage = await hydrateCollegeVideos(pageData);

  return {
    data: hydratedPage.map(toApiCollege),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function getCollegeOptions() {
  const colleges = await prisma.college.findMany({
    where: { isVisible: true },
    select: { state: true, city: true, collegeType: true },
  });
  const courses = await prisma.course.findMany({
    where: { college: { isVisible: true } },
    select: { courseName: true },
    distinct: ["courseName"],
    orderBy: { courseName: "asc" },
  });

  return {
    states: [...new Set(colleges.map((college) => college.state))].sort(),
    cities: [...new Set(colleges.map((college) => college.city))].sort(),
    locations: [...new Map(colleges.map((college) => [`${college.state}:${college.city}`, { state: college.state, city: college.city }])).values()],
    college_types: [...new Set(colleges.map((college) => college.collegeType))].sort(),
    courses: courses.map((course) => course.courseName),
  };
}

function sortCollegeResults(colleges, sortBy) {
  const minAnnualCost = (college) => Math.min(...college.fees.map((fee) => fee.totalAnnualCost), Number.MAX_SAFE_INTEGER);
  const maxAveragePackage = (college) => Math.max(...college.placements.map((item) => Number(item.averagePackage)), 0);
  const rating = (college) => Number(college.rating);

  return [...colleges].sort((a, b) => {
    if (sortBy === "fees_low_to_high" || sortBy === "lowest_total_cost") {
      return minAnnualCost(a) - minAnnualCost(b);
    }
    if (sortBy === "fees_high_to_low") {
      return minAnnualCost(b) - minAnnualCost(a);
    }
    if (sortBy === "placement_high_to_low") {
      return maxAveragePackage(b) - maxAveragePackage(a);
    }
    if (sortBy === "rating_high_to_low") {
      return rating(b) - rating(a);
    }

    const scoreA = rating(a) * 20 + maxAveragePackage(a) * 3 - minAnnualCost(a) / 100000;
    const scoreB = rating(b) * 20 + maxAveragePackage(b) * 3 - minAnnualCost(b) / 100000;
    return scoreB - scoreA;
  });
}

export async function getCollegeBySlug(slug) {
  const college = await prisma.college.findFirst({
    where: { slug },
    include: collegeInclude,
  });
  if (!college) return null;
  const visibleRows = await prisma.$queryRaw`SELECT id FROM colleges WHERE id = ${college.id} AND is_visible = true`;
  if (!visibleRows.length) return null;
  const [hydratedCollege] = await hydrateCollegeVideos([college]);
  return toApiCollege(hydratedCollege);
}

export async function compareColleges(ids) {
  const visibleRows = await prisma.$queryRaw`SELECT id FROM colleges WHERE is_visible = true`;
  const colleges = await prisma.college.findMany({
    where: { id: { in: ids.filter((id) => visibleRows.some((row) => row.id === id)) } },
    include: collegeInclude,
  });

  await prisma.compareHistory.create({
    data: {
      collegeIds: ids,
      colleges: {
        connect: colleges.map((college) => ({ id: college.id })),
      },
    },
  });

  const order = new Map(ids.map((id, index) => [id, index]));
  const hydratedColleges = await hydrateCollegeVideos(colleges);
  return hydratedColleges.sort((a, b) => order.get(a.id) - order.get(b.id)).map(toApiCollege);
}
