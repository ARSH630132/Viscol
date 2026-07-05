"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Heart, MapPin, ShieldCheck, Star } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/college/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatINR, formatLPA, type College } from "@/lib/college-data";
import { compareState, wishlistState } from "@/lib/college-state";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CollegeDetailPage() {
  const params = useParams<{ slugs: string }>();
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const slug = params.slugs;

    setLoading(true);
    setActiveImage(0);

    fetch(`${API_BASE_URL}/api/colleges/${slug}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return mapApiCollegeToUiCollege(payload.data);
      })
      .then((data) => {
        setCollege(data);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setCollege(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [params.slugs]);

  if (loading) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold">Loading college...</h1>
        </div>
      </AppLayout>
    );
  }

  if (!college) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold">College not found</h1>
        </div>
      </AppLayout>
    );
  }

  const placementChart = [
    { name: "Avg Package", value: college.averagePackageLpa },
    { name: "Highest", value: college.highestPackageLpa },
    { name: "Placement %", value: college.placementRate / 10 },
  ];

  const budgetStars = `${"★".repeat(college.budgetScore)}${"☆".repeat(5 - college.budgetScore)}`;

  return (
    <AppLayout>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <img
            src={college.gallery[activeImage]}
            alt={`${college.name} image ${activeImage + 1}`}
            className="h-[320px] w-full rounded-2xl object-cover"
            width={1280}
            height={832}
          />
          <div className="grid grid-cols-4 gap-2">
            {college.gallery.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`overflow-hidden rounded-lg border ${activeImage === index ? "border-primary" : "border-border"}`}
                onClick={() => setActiveImage(index)}
              >
                <img src={image} alt={`${college.name} thumbnail ${index + 1}`} className="h-16 w-full object-cover" loading="lazy" width={1280} height={832} />
              </button>
            ))}
          </div>
        </div>

        <Card className="premium-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 font-semibold text-primary">
                {college.logoText}
              </div>
              <h1 className="text-2xl font-semibold">{college.name}</h1>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {college.city}, {college.state}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-primary text-primary" /> {college.rating}/5
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {college.accreditation.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
            {college.scholarshipAvailable ? <Badge>Scholarship Available</Badge> : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Metric label="Annual Cost" value={formatINR(college.annualCost)} />
            <Metric label="Average Package" value={formatLPA(college.averagePackageLpa)} />
            <Metric label="Highest Package" value={formatLPA(college.highestPackageLpa)} />
            <Metric label="Placement Rate" value={`${college.placementRate}%`} />
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Button onClick={() => toast.success("Application initiated")}>Apply Now</Button>
            <Button
              variant="outline"
              onClick={() => {
                const current = compareState.get();
                const next = current.includes(college.id) ? current : [...current, college.id].slice(0, 3);
                compareState.set(next);
                toast.success("Added to compare");
              }}
            >
              Compare
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const current = wishlistState.get();
                const next = current.includes(college.id)
                  ? current.filter((item) => item !== college.id)
                  : [...current, college.id];
                wishlistState.set(next);
                toast.success("Saved");
              }}
            >
              <Heart className="mr-1 h-4 w-4" /> Save
            </Button>
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Tabs defaultValue="overview">
          <TabsList className="h-auto flex-wrap gap-2 rounded-xl p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="placements">Placements</TabsTrigger>
            <TabsTrigger value="hostel">Hostel</TabsTrigger>
            <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="premium-card mt-3 p-5">
              <h2 className="text-xl font-semibold">Overview</h2>
              <p className="mt-2 text-muted-foreground">{college.description}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Est. Year" value={`${college.establishedYear}`} />
                <Metric label="Affiliation" value={college.affiliation} />
                <Metric label="Approvals" value={college.approvals.join(", ")} />
                <Metric label="Campus Area" value={`${college.campusAreaAcres} Acres`} />
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Courses Offered</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["B.Tech", "M.Tech", "MBA", "BCA", "MCA"].map((course) => (
                    <Badge key={course} variant="secondary">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="fees">
            <Card className="premium-card mt-3 p-5">
              <h2 className="text-xl font-semibold">Fee Structure</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label="Tuition Fee" value={formatINR(college.fees.tuition)} />
                <Metric label="Hostel Fee" value={formatINR(college.fees.hostel)} />
                <Metric label="Mess Fee" value={formatINR(college.fees.mess)} />
                <Metric label="Exam Fee" value={formatINR(college.fees.exam)} />
                <Metric label="Transport Fee" value={formatINR(college.fees.transport)} />
                <Metric label="Total Annual Cost" value={formatINR(college.annualCost)} />
                <Metric label="Total Course Cost" value={formatINR(college.courseCost)} />
                <Metric label="Budget Score" value={budgetStars} />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="placements">
            <Card className="premium-card mt-3 p-5">
              <h2 className="text-xl font-semibold">Placement Insights</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric label="Average Package" value={formatLPA(college.averagePackageLpa)} />
                <Metric label="Highest Package" value={formatLPA(college.highestPackageLpa)} />
                <Metric label="Placement Rate" value={`${college.placementRate}%`} />
              </div>
              <div className="mt-4 h-72 rounded-xl border border-border bg-background p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={placementChart}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Top Recruiters</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {college.recruiters.map((recruiter) => (
                    <Badge key={recruiter} variant="outline">
                      {recruiter}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="hostel">
            <Card className="premium-card mt-3 p-5">
              <h2 className="text-xl font-semibold">Hostel Facilities</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {college.hostelFacilities.map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background p-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="scholarships">
            <Card className="premium-card mt-3 p-5">
              <h2 className="text-xl font-semibold">Scholarships</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {college.scholarships.map((item) => (
                  <div key={item} className="rounded-xl border border-border bg-background p-4">
                    <p className="font-medium">{item}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Eligibility and documentation support available.</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="gallery">
            <Card className="premium-card mt-3 p-5">
              <h2 className="text-xl font-semibold">Gallery</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {college.gallery.map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt={`${college.name} gallery ${index + 1}`}
                    className="h-40 w-full rounded-xl object-cover"
                    loading="lazy"
                    width={1280}
                    height={832}
                  />
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="premium-card mt-3 p-5">
              <h2 className="text-xl font-semibold">Student Reviews</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {college.reviews.map((review, index) => (
                  <Card key={`${review.student}-${index}`} className="rounded-xl border border-border bg-background p-4">
                    <p className="font-medium">{review.student}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <p>Academics: {review.academics}/5</p>
                      <p>Placements: {review.placements}/5</p>
                      <p>Hostel: {review.hostel}/5</p>
                      <p>Faculty: {review.faculty}/5</p>
                      <p>Campus Life: {review.campusLife}/5</p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </AppLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function mapApiCollegeToUiCollege(college: ApiCollege): College {
  const firstCourse = college.courses?.[0];
  const firstFee = college.fees?.[0] || firstCourse?.fees?.[0];
  const firstPlacement = college.placements?.[0] || firstCourse?.placements?.[0];
  const gallery = college.gallery_images?.length ? college.gallery_images : [college.cover_image_url || "/images/campus-1.jpg"];
  const annualCost = firstFee?.total_annual_cost || 0;

  return {
    id: college.id,
    slug: college.slug,
    name: college.name,
    logoText: college.name
      .split(" ")
      .filter((word) => word.length > 2)
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase(),
    state: college.state,
    city: college.city,
    course: (firstCourse?.course_name || "B.Tech") as College["course"],
    collegeType: college.college_type as College["collegeType"],
    description: college.description,
    image: college.cover_image_url || gallery[0],
    gallery,
    rating: college.rating,
    fees: {
      tuition: firstFee?.tuition_fee_yearly || 0,
      hostel: firstFee?.hostel_fee_yearly || 0,
      mess: firstFee?.mess_fee_yearly || 0,
      exam: firstFee?.exam_fee_yearly || 0,
      transport: firstFee?.transport_fee_yearly || 0,
    },
    annualCost,
    courseCost: firstFee?.total_course_cost || annualCost * (firstCourse?.duration_years || 4),
    averagePackageLpa: firstPlacement?.average_package || 0,
    highestPackageLpa: firstPlacement?.highest_package || 0,
    placementRate: firstPlacement?.placement_percentage || 0,
    scholarshipAvailable: college.scholarships?.some((item) => item.scholarship_available) || false,
    scholarships: college.scholarships?.map((item) => item.title) || [],
    accreditation: college.accreditations || [],
    approvals: college.approvals || [],
    affiliation: college.affiliation,
    campusAreaAcres: 0,
    establishedYear: college.established_year,
    recruiters: firstPlacement?.top_recruiters || [],
    hostelFacilities: college.hostel?.facilities || [],
    budgetScore: annualCost < 120000 ? 5 : annualCost < 180000 ? 4 : annualCost < 260000 ? 3 : 2,
    reviews:
      college.reviews?.map((review) => ({
        student: review.student_name,
        academics: review.academics_rating,
        placements: review.placement_rating,
        hostel: review.hostel_rating,
        faculty: review.academics_rating,
        campusLife: review.campus_rating,
        comment: review.review_text,
      })) || [],
  };
}

interface ApiCollege {
  id: number;
  name: string;
  slug: string;
  description: string;
  college_type: string;
  state: string;
  city: string;
  established_year: number;
  affiliation: string;
  approvals: string[];
  accreditations: string[];
  rating: number;
  cover_image_url: string | null;
  gallery_images: string[];
  courses?: Array<{
    course_name: string;
    duration_years: number;
    fees?: ApiFee[];
    placements?: ApiPlacement[];
  }>;
  fees?: ApiFee[];
  placements?: ApiPlacement[];
  scholarships?: Array<{
    title: string;
    scholarship_available: boolean;
  }>;
  hostel?: {
    facilities: string[];
  } | null;
  reviews?: Array<{
    student_name: string;
    academics_rating: number;
    placement_rating: number;
    hostel_rating: number;
    campus_rating: number;
    review_text: string;
  }>;
}

interface ApiFee {
  tuition_fee_yearly: number;
  hostel_fee_yearly: number;
  mess_fee_yearly: number;
  exam_fee_yearly: number;
  transport_fee_yearly: number;
  total_annual_cost: number;
  total_course_cost: number;
}

interface ApiPlacement {
  average_package: number;
  highest_package: number;
  placement_percentage: number;
  top_recruiters: string[];
}
