export type Course = "B.Tech" | "MBA" | "BCA" | "MCA" | "MBBS";
export type CollegeType = "Government" | "Private";
export type PlacementPreference = "Above 4 LPA" | "Above 6 LPA" | "Above 10 LPA";

export interface CollegeReview {
  student: string;
  academics: number;
  placements: number;
  hostel: number;
  faculty: number;
  campusLife: number;
  comment: string;
}

export interface CollegeFee {
  tuition: number;
  hostel: number;
  mess: number;
  exam: number;
  transport: number;
}

export interface College {
  id: number;
  slug: string;
  name: string;
  logoText: string;
  state: string;
  city: string;
  course: Course;
  collegeType: CollegeType;
  description: string;
  image: string;
  gallery: string[];
  rating: number;
  fees: CollegeFee;
  annualCost: number;
  courseCost: number;
  averagePackageLpa: number;
  highestPackageLpa: number;
  placementRate: number;
  scholarshipAvailable: boolean;
  scholarships: string[];
  accreditation: string[];
  approvals: string[];
  affiliation: string;
  campusAreaAcres: number;
  establishedYear: number;
  recruiters: string[];
  hostelFacilities: string[];
  budgetScore: 1 | 2 | 3 | 4 | 5;
  reviews: CollegeReview[];
}

const campusImages = [
  "/images/campus-1.jpg",
  "/images/campus-2.jpg",
  "/images/campus-3.jpg",
  "/images/campus-4.jpg",
  "/images/campus-5.jpg",
  "/images/campus-6.jpg",
];

const baseNames = [
  "RR Group of Institutions",
  "Shri Ramswaroop Memorial University",
  "Babu Banarasi Das University",
  "Integral University",
  "AKTU Affiliated Tech Campus",
  "Lucknow School of Engineering",
  "Northern Institute of Management",
  "City Institute of Technology",
  "Heritage Professional University",
  "Pioneer College of Applied Sciences",
];

const states = [
  { state: "Uttar Pradesh", city: "Lucknow" },
  { state: "Uttar Pradesh", city: "Noida" },
  { state: "Maharashtra", city: "Pune" },
  { state: "Karnataka", city: "Bengaluru" },
  { state: "Delhi", city: "New Delhi" },
  { state: "Rajasthan", city: "Jaipur" },
  { state: "Madhya Pradesh", city: "Indore" },
  { state: "Telangana", city: "Hyderabad" },
  { state: "Tamil Nadu", city: "Chennai" },
  { state: "Gujarat", city: "Ahmedabad" },
];

const courses: Course[] = ["B.Tech", "MBA", "BCA", "MCA", "MBBS"];
const collegeTypes: CollegeType[] = ["Government", "Private"];

const recruiters = [
  "TCS",
  "Infosys",
  "Wipro",
  "HCL",
  "Accenture",
  "Cognizant",
  "Deloitte",
  "Capgemini",
  "Amazon",
  "Flipkart",
];

const scholarships = [
  "Merit Scholarship",
  "Sports Scholarship",
  "Government Scholarship",
  "Financial Aid",
];

const hostelFacilities = [
  "Boys Hostel",
  "Girls Hostel",
  "AC/Non-AC Rooms",
  "Hygienic Mess",
  "High-Speed WiFi",
  "Laundry Service",
  "Indoor & Outdoor Sports",
];

const reviewComments = [
  "Strong academics, helpful placement team, and affordable fee structure.",
  "Hostel quality is good and campus environment feels safe and energetic.",
  "Faculty support is excellent and recruiters are improving every year.",
  "Balanced college for middle-class students with strong value for money.",
];

const badgeApprovals = ["AICTE Approved", "UGC Approved", "NMC Recognized", "NAAC A+"];

const formatLogoText = (name: string) =>
  name
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const toINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export const formatINR = toINR;
export const formatLPA = (value: number) => `${value.toFixed(1)} LPA`;

export const colleges: College[] = Array.from({ length: 50 }).map((_, i) => {
  const base = baseNames[i % baseNames.length];
  const loc = states[i % states.length];
  const course = courses[i % courses.length];
  const collegeType = collegeTypes[i % collegeTypes.length];

  const tuition = 55000 + (i % 8) * 25000 + Math.floor(i / 5) * 8000;
  const hostel = 25000 + (i % 6) * 7000;
  const mess = 18000 + (i % 4) * 4000;
  const exam = 5000 + (i % 5) * 1200;
  const transport = 8000 + (i % 3) * 2500;

  const annualCost = tuition + hostel + mess + exam + transport;
  const courseYears = course === "MBBS" ? 5 : 4;
  const courseCost = annualCost * courseYears;

  const averagePackageLpa = Number((3.8 + (i % 9) * 0.55).toFixed(1));
  const highestPackageLpa = Number((averagePackageLpa * (4.2 + (i % 3) * 0.5)).toFixed(1));
  const placementRate = 68 + (i % 10) * 3;
  const rating = Number((3.8 + (i % 8) * 0.16).toFixed(1));

  const scholarshipAvailable = i % 2 === 0 || i % 5 === 0;
  const budgetScore = annualCost < 120000 ? 5 : annualCost < 180000 ? 4 : annualCost < 260000 ? 3 : 2;

  const nameSuffix = i >= baseNames.length ? ` ${Math.floor(i / baseNames.length) + 1}` : "";
  const name = `${base}${nameSuffix}`;

  return {
    id: i + 1,
    slug: `${slugify(name)}-${i + 1}`,
    name,
    logoText: formatLogoText(name),
    state: loc.state,
    city: loc.city,
    course,
    collegeType,
    description:
      "A career-focused institution known for practical learning, quality faculty, and strong placement support tailored for value-conscious families.",
    image: campusImages[i % campusImages.length],
    gallery: [
      campusImages[i % campusImages.length],
      campusImages[(i + 1) % campusImages.length],
      campusImages[(i + 2) % campusImages.length],
      campusImages[(i + 3) % campusImages.length],
    ],
    rating,
    fees: {
      tuition,
      hostel,
      mess,
      exam,
      transport,
    },
    annualCost,
    courseCost,
    averagePackageLpa,
    highestPackageLpa,
    placementRate,
    scholarshipAvailable,
    scholarships: scholarshipAvailable ? scholarships : ["Merit Scholarship", "Financial Aid"],
    accreditation: ["NAAC Accredited", i % 2 ? "NBA Accredited" : "AICTE Accredited"],
    approvals: [badgeApprovals[i % badgeApprovals.length], badgeApprovals[(i + 1) % badgeApprovals.length]],
    affiliation: i % 2 === 0 ? "AKTU, Lucknow" : "State Technical University",
    campusAreaAcres: 18 + (i % 8) * 6,
    establishedYear: 1998 + (i % 20),
    recruiters: recruiters.slice(i % 4, i % 4 + 5),
    hostelFacilities,
    budgetScore,
    reviews: Array.from({ length: 4 }).map((__, idx) => ({
      student: `Student ${idx + 1}`,
      academics: 3.5 + ((i + idx) % 3) * 0.5,
      placements: 3.5 + ((i + idx + 1) % 3) * 0.5,
      hostel: 3.5 + ((i + idx + 2) % 3) * 0.5,
      faculty: 3.5 + ((i + idx + 3) % 3) * 0.5,
      campusLife: 3.5 + ((i + idx + 4) % 3) * 0.5,
      comment: reviewComments[(i + idx) % reviewComments.length],
    })),
  };
});

export const courseOptions: Course[] = courses;
export const stateOptions = [...new Set(colleges.map((college) => college.state))];
export const cityOptions = [...new Set(colleges.map((college) => college.city))];
export const collegeTypeOptions: CollegeType[] = collegeTypes;
export const placementPreferences: PlacementPreference[] = [
  "Above 4 LPA",
  "Above 6 LPA",
  "Above 10 LPA",
];

export const getCollegeBySlug = (slug: string) => colleges.find((college) => college.slug === slug);
