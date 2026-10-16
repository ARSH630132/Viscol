"use client";

import { BookOpen, Building2, Eye, ExternalLink, Gift, ImageIcon, MapPin, Pencil, Plus, Save, Search, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { managementFetch } from "@/lib/management-client";

type Fee = {
  tuitionFeeYearly: number;
  hostelFeeYearly: number;
  messFeeYearly: number;
  examFeeYearly: number;
  transportFeeYearly: number;
  otherChargesYearly: number;
  totalAnnualCost: number;
  totalCourseCost: number;
};

type Placement = {
  averagePackage: number;
  highestPackage: number;
  placementPercentage: number;
  topRecruiters: string[];
};

type CourseDraft = {
  courseName: string;
  branchName: string;
  durationYears: number;
  eligibility: string;
  entranceExam: string;
  seats: number;
  fees: Fee;
  placements: Placement;
};

type ScholarshipDraft = {
  title: string;
  description: string;
  eligibility: string;
  amount: number;
  scholarshipAvailable: boolean;
};

type HostelDraft = {
  boysHostelAvailable: boolean;
  girlsHostelAvailable: boolean;
  roomTypes: string[];
  facilities: string[];
  yearlyFee: number;
};

type ReviewDraft = {
  studentName: string;
  rating: number;
  academicsRating: number;
  placementRating: number;
  hostelRating: number;
  campusRating: number;
  reviewText: string;
};

export type AdminCollege = {
  id: number;
  name: string;
  slug: string;
  description: string;
  college_type: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  established_year: number;
  affiliation: string;
  approvals: string[];
  accreditations: string[];
  rating: number;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[];
  video_url: string | null;
  video_urls: string[];
  isVisible: boolean;
  courses: Array<{
    course_name: string;
    branch_name: string;
    duration_years: number;
    eligibility: string;
    entrance_exam: string | null;
    seats: number;
    fees?: Array<{
      tuition_fee_yearly: number;
      hostel_fee_yearly: number;
      mess_fee_yearly: number;
      exam_fee_yearly: number;
      transport_fee_yearly: number;
      other_charges_yearly: number;
      total_annual_cost: number;
      total_course_cost: number;
    }>;
    placements?: Array<{
      average_package: number;
      highest_package: number;
      placement_percentage: number;
      top_recruiters: string[];
    }>;
  }>;
  scholarships: Array<{
    title: string;
    description: string;
    eligibility: string;
    amount: number;
    scholarship_available: boolean;
  }>;
  hostel: {
    boys_hostel_available: boolean;
    girls_hostel_available: boolean;
    room_types: string[];
    facilities: string[];
    yearly_fee: number;
  } | null;
  reviews: Array<{
    student_name: string;
    rating: number;
    academics_rating: number;
    placement_rating: number;
    hostel_rating: number;
    campus_rating: number;
    review_text: string;
  }>;
};

type CollegeDraft = Omit<AdminCollege, "id" | "college_type" | "established_year" | "website" | "email" | "phone" | "logo_url" | "cover_image_url" | "gallery_images" | "video_url" | "video_urls" | "courses" | "scholarships" | "hostel" | "reviews"> & {
  name: string;
  collegeType: "Government" | "Private" | "Deemed" | "Autonomous";
  establishedYear: number;
  website: string;
  email: string;
  phone: string;
  logoUrl: string;
  coverImageUrl: string;
  galleryImages: string[];
  videoUrls: string[];
  courses: CourseDraft[];
  scholarships: ScholarshipDraft[];
  hostel: HostelDraft;
  reviews: ReviewDraft[];
};

type CollegeSection = "details" | "visibility";
export type CollegeEditorTab = "basic" | "media" | "courses" | "placements" | "scholarships" | "reviews";

const emptyFee = (): Fee => ({
  tuitionFeeYearly: 0,
  hostelFeeYearly: 0,
  messFeeYearly: 0,
  examFeeYearly: 0,
  transportFeeYearly: 0,
  otherChargesYearly: 0,
  totalAnnualCost: 0,
  totalCourseCost: 0,
});

const emptyPlacement = (): Placement => ({
  averagePackage: 0,
  highestPackage: 0,
  placementPercentage: 0,
  topRecruiters: [],
});

const emptyCourse = (): CourseDraft => ({
  courseName: "",
  branchName: "",
  durationYears: 4,
  eligibility: "",
  entranceExam: "",
  seats: 0,
  fees: emptyFee(),
  placements: emptyPlacement(),
});

const emptyHostel = (): HostelDraft => ({
  boysHostelAvailable: false,
  girlsHostelAvailable: false,
  roomTypes: [],
  facilities: [],
  yearlyFee: 0,
});

const emptyReview = (): ReviewDraft => ({
  studentName: "",
  rating: 0,
  academicsRating: 0,
  placementRating: 0,
  hostelRating: 0,
  campusRating: 0,
  reviewText: "",
});

const emptyDraft = (): CollegeDraft => ({
  name: "",
  slug: "",
  description: "",
  collegeType: "Private",
  state: "",
  city: "",
  address: "",
  pincode: "",
  website: "",
  email: "",
  phone: "",
  establishedYear: new Date().getFullYear(),
  affiliation: "",
  approvals: [],
  accreditations: [],
  rating: 0,
  logoUrl: "",
  coverImageUrl: "",
  galleryImages: [],
  videoUrls: [],
  isVisible: true,
  courses: [],
  scholarships: [],
  hostel: emptyHostel(),
  reviews: [],
});

const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const asText = (items: string[]) => items.join("\n");

function toDraft(college: AdminCollege): CollegeDraft {
  return {
    name: college.name,
    slug: college.slug,
    description: college.description,
    collegeType: college.college_type as CollegeDraft["collegeType"],
    state: college.state,
    city: college.city,
    address: college.address,
    pincode: college.pincode,
    website: college.website ?? "",
    email: college.email ?? "",
    phone: college.phone ?? "",
    establishedYear: college.established_year,
    affiliation: college.affiliation,
    approvals: college.approvals,
    accreditations: college.accreditations,
    rating: college.rating,
    logoUrl: college.logo_url ?? "",
    coverImageUrl: college.cover_image_url ?? "",
    galleryImages: college.gallery_images,
    videoUrls: college.video_urls?.length ? college.video_urls : college.video_url ? [college.video_url] : [],
    isVisible: college.isVisible,
    courses: college.courses.map((course) => {
      const fee = course.fees?.[0];
      const placement = course.placements?.[0];
      return {
        courseName: course.course_name,
        branchName: course.branch_name,
        durationYears: course.duration_years,
        eligibility: course.eligibility,
        entranceExam: course.entrance_exam ?? "",
        seats: course.seats,
        fees: fee ? {
          tuitionFeeYearly: fee.tuition_fee_yearly,
          hostelFeeYearly: fee.hostel_fee_yearly,
          messFeeYearly: fee.mess_fee_yearly,
          examFeeYearly: fee.exam_fee_yearly,
          transportFeeYearly: fee.transport_fee_yearly,
          otherChargesYearly: fee.other_charges_yearly,
          totalAnnualCost: fee.total_annual_cost,
          totalCourseCost: fee.total_course_cost,
        } : emptyFee(),
        placements: placement ? {
          averagePackage: placement.average_package,
          highestPackage: placement.highest_package,
          placementPercentage: placement.placement_percentage,
          topRecruiters: placement.top_recruiters,
        } : emptyPlacement(),
      };
    }),
    scholarships: college.scholarships.map((item) => ({
      title: item.title,
      description: item.description,
      eligibility: item.eligibility,
      amount: item.amount,
      scholarshipAvailable: item.scholarship_available,
    })),
    hostel: college.hostel ? {
      boysHostelAvailable: college.hostel.boys_hostel_available,
      girlsHostelAvailable: college.hostel.girls_hostel_available,
      roomTypes: college.hostel.room_types,
      facilities: college.hostel.facilities,
      yearlyFee: college.hostel.yearly_fee,
    } : emptyHostel(),
    reviews: college.reviews.map((item) => ({
      studentName: item.student_name,
      rating: item.rating,
      academicsRating: item.academics_rating,
      placementRating: item.placement_rating,
      hostelRating: item.hostel_rating,
      campusRating: item.campus_rating,
      reviewText: item.review_text,
    })),
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, onChange, min, max, step = 1 }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <Input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </Field>
  );
}

function DynamicTextList({ label, items, onChange, placeholder, addLabel = "Add" }: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(event) => onChange(items.map((current, itemIndex) => itemIndex === index ? event.target.value : current))}
          />
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label.toLowerCase()} ${index + 1}`} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus className="h-4 w-4" /> {addLabel}
      </Button>
    </div>
  );
}

function CoursePlacementFields({ placement, onChange }: {
  placement: Placement;
  onChange: (placement: Placement) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <NumberField label="Average package (LPA)" value={placement.averagePackage} onChange={(averagePackage) => onChange({ ...placement, averagePackage })} min={0} step={0.1} />
      <NumberField label="Highest package (LPA)" value={placement.highestPackage} onChange={(highestPackage) => onChange({ ...placement, highestPackage })} min={0} step={0.1} />
      <NumberField label="Placement rate (%)" value={placement.placementPercentage} onChange={(placementPercentage) => onChange({ ...placement, placementPercentage })} min={0} max={100} step={0.1} />
      <DynamicTextList
        label="Top recruiters"
        items={placement.topRecruiters}
        placeholder="Recruiter name"
        addLabel="Add Recruiter"
        onChange={(topRecruiters) => onChange({ ...placement, topRecruiters })}
      />
    </div>
  );
}

function MediaUploadInput({ accept, uploadPath = "/admin/uploads/media", onUploaded }: { accept: string; uploadPath?: string; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    try {
      const result = await managementFetch<{ data: { url: string } }>(uploadPath, {
        method: "POST",
        body: form,
      });
      onUploaded(result.data.url);
      toast.success("Media uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload media");
    } finally {
      setUploading(false);
    }
  };

  return <Input type="file" accept={accept} onChange={uploadFile} disabled={uploading} aria-label={uploading ? "Uploading media" : "Upload media"} />;
}

export function CollegeManagement({ colleges, onCollegeSaved, mode = "admin", activeTab, onActiveTabChange }: {
  colleges: AdminCollege[];
  onCollegeSaved: (college: AdminCollege) => void;
  mode?: "admin" | "college";
  activeTab?: CollegeEditorTab;
  onActiveTabChange?: (tab: CollegeEditorTab) => void;
}) {
  const [section, setSection] = useState<CollegeSection>("details");
  const [draft, setDraft] = useState<CollegeDraft | null>(() => mode === "college" && colleges.length === 1 ? toDraft(colleges[0]) : null);
  const [editingId, setEditingId] = useState<number | null>(() => mode === "college" && colleges.length === 1 ? colleges[0].id : null);
  const [editorTab, setEditorTab] = useState<CollegeEditorTab>(() => mode === "college" ? activeTab ?? "basic" : "basic");
  const [saving, setSaving] = useState(false);
  const [visibilitySearch, setVisibilitySearch] = useState("");

  const currentEditorTab = mode === "college" ? activeTab ?? editorTab : editorTab;

  const changeEditorTab = (tab: CollegeEditorTab) => {
    setEditorTab(tab);
    onActiveTabChange?.(tab);
  };

  const startCreate = () => {
    setEditingId(null);
    changeEditorTab("basic");
    setDraft(emptyDraft());
  };

  const startEdit = (college: AdminCollege) => {
    setEditingId(college.id);
    changeEditorTab("basic");
    setDraft(toDraft(college));
  };

  const saveCollege = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    const missingBasicInfo = [
      draft.name,
      draft.state,
      draft.city,
      draft.pincode,
      draft.address,
      draft.description,
    ].some((value) => !value.trim());
    if (missingBasicInfo) {
      changeEditorTab("basic");
      toast.error("Complete all required college information fields");
      return;
    }
    if (
      (draft.website && !/^https?:\/\/\S+\.\S+$/i.test(draft.website)) ||
      (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
    ) {
      changeEditorTab("basic");
      toast.error("Enter a valid college website and email address");
      return;
    }
    if (draft.courses.some((course) => !course.courseName.trim() || !course.branchName.trim())) {
      changeEditorTab("courses");
      toast.error("Enter a course name and branch for every course");
      return;
    }
    setSaving(true);
    try {
      const path = mode === "college"
        ? `/college-dashboard/colleges/${editingId}`
        : editingId === null ? "/admin/colleges" : `/admin/colleges/${editingId}`;
      const payload = mode === "college"
        ? Object.fromEntries(Object.entries(draft).filter(([key]) => !["slug", "rating", "isVisible", "reviews"].includes(key)))
        : draft;
      const result = await managementFetch<{ data: AdminCollege }>(path, {
        method: mode === "college" || editingId !== null ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      onCollegeSaved(result.data);
      toast.success(mode === "college" ? "College details saved" : editingId === null ? "College created" : "College details updated");
      if (mode !== "college") {
        setDraft(null);
        setEditingId(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save college");
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (college: AdminCollege, isVisible: boolean) => {
    try {
      const result = await managementFetch<{ data: { id: number; isVisible: boolean } }>(
        `/admin/colleges/${college.id}/visibility`,
        { method: "PATCH", body: JSON.stringify({ isVisible }) },
      );
      onCollegeSaved({ ...college, isVisible: result.data.isVisible });
      toast.success(`${college.name} is now ${result.data.isVisible ? "visible" : "hidden"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update college visibility");
    }
  };

  const updateDraft = (update: (current: CollegeDraft) => CollegeDraft) => {
    setDraft((current) => current ? update(current) : current);
  };
  const mediaUploadPath = mode === "college" && editingId !== null
    ? `/college-dashboard/colleges/${editingId}/uploads/media`
    : "/admin/uploads/media";

  return (
    <div className="space-y-5">
      {mode === "admin" ? <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {([
          { id: "details", label: "College Information" },
          { id: "visibility", label: "College Visibility" },
        ] as const).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { setSection(item.id); setDraft(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              section === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div> : null}

      {section === "details" ? (
        draft ? (
          <form onSubmit={saveCollege} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{mode === "college" ? "College Information" : editingId === null ? "Add College" : `Edit ${draft.name}`}</h2>
              <div className="flex gap-2">
                {mode === "admin" ? <Button type="button" variant="outline" onClick={() => { setDraft(null); setEditingId(null); }}>
                  <X className="h-4 w-4" /> Cancel
                </Button> : null}
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : mode === "college" ? "Save Changes" : "Save College"}
                </Button>
              </div>
            </div>

            <Tabs value={currentEditorTab} onValueChange={(value) => changeEditorTab(value as CollegeEditorTab)} className="space-y-4">
              {mode === "admin" ? <TabsList aria-label="College details sections" className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger value="basic" className="min-h-11 flex-1 gap-2 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  <Building2 className="h-4 w-4" /> Basic Info
                </TabsTrigger>
                <TabsTrigger value="media" className="min-h-11 flex-1 gap-2 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  <ImageIcon className="h-4 w-4" /> Images &amp; Media
                </TabsTrigger>
                <TabsTrigger value="courses" className="min-h-11 flex-1 gap-2 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  <BookOpen className="h-4 w-4" /> Courses, Fees &amp; Placements
                </TabsTrigger>
                <TabsTrigger value="scholarships" className="min-h-11 flex-1 gap-2 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  <Gift className="h-4 w-4" /> Scholarships &amp; Hostel
                </TabsTrigger>
                <TabsTrigger value="reviews" className="min-h-11 flex-1 gap-2 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  <Star className="h-4 w-4" /> Reviews
                </TabsTrigger>
              </TabsList> : null}

              <TabsContent value="basic" className="mt-4 space-y-4">
            <Card className="premium-card space-y-4 p-5">
              <h3 className="font-semibold">College Information</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="College name"><Input required value={draft.name} onChange={(event) => updateDraft((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: editingId === null ? event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : current.slug,
                }))} /></Field>
                {mode === "admin" ? <Field label="Slug"><Input value={draft.slug} readOnly={editingId === null} onChange={(event) => updateDraft((current) => ({ ...current, slug: event.target.value }))} /></Field> : null}
                <Field label="College type">
                  <select value={draft.collegeType} onChange={(event) => updateDraft((current) => ({ ...current, collegeType: event.target.value as CollegeDraft["collegeType"] }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option>Government</option><option>Private</option><option>Deemed</option><option>Autonomous</option>
                  </select>
                </Field>
                <Field label="State"><Input required value={draft.state} onChange={(event) => updateDraft((current) => ({ ...current, state: event.target.value }))} /></Field>
                <Field label="City"><Input required value={draft.city} onChange={(event) => updateDraft((current) => ({ ...current, city: event.target.value }))} /></Field>
                <Field label="Pincode"><Input required value={draft.pincode} onChange={(event) => updateDraft((current) => ({ ...current, pincode: event.target.value }))} /></Field>
                <Field label="Address"><Input required value={draft.address} onChange={(event) => updateDraft((current) => ({ ...current, address: event.target.value }))} /></Field>
                <Field label="Website"><Input type="url" value={draft.website} onChange={(event) => updateDraft((current) => ({ ...current, website: event.target.value }))} /></Field>
                <Field label="Email"><Input type="email" value={draft.email} onChange={(event) => updateDraft((current) => ({ ...current, email: event.target.value }))} /></Field>
                <Field label="Phone"><Input value={draft.phone} onChange={(event) => updateDraft((current) => ({ ...current, phone: event.target.value }))} /></Field>
                <NumberField label="Established year" value={draft.establishedYear} onChange={(establishedYear) => updateDraft((current) => ({ ...current, establishedYear }))} min={1800} max={new Date().getFullYear()} />
                {mode === "admin" ? <NumberField label="Rating" value={draft.rating} onChange={(rating) => updateDraft((current) => ({ ...current, rating }))} min={0} max={5} step={0.1} /> : null}
                <Field label="Affiliation"><Input value={draft.affiliation} onChange={(event) => updateDraft((current) => ({ ...current, affiliation: event.target.value }))} /></Field>
              </div>
              <Field label="Description"><Textarea required value={draft.description} onChange={(event) => updateDraft((current) => ({ ...current, description: event.target.value }))} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Approvals (one per line)"><Textarea value={asText(draft.approvals)} onChange={(event) => updateDraft((current) => ({ ...current, approvals: lines(event.target.value) }))} /></Field>
                <Field label="Accreditations (one per line)"><Textarea value={asText(draft.accreditations)} onChange={(event) => updateDraft((current) => ({ ...current, accreditations: lines(event.target.value) }))} /></Field>
              </div>
              <label className="flex items-center gap-3 text-sm font-medium">
                <Switch checked={draft.isVisible} onCheckedChange={(isVisible) => updateDraft((current) => ({ ...current, isVisible }))} />
                Publicly visible
              </label>
            </Card>

              </TabsContent>

              <TabsContent value="media" className="mt-4 space-y-4">
            <Card className="premium-card space-y-4 p-5">
              <h3 className="font-semibold">Images and Video</h3>
              <p className="text-sm text-muted-foreground">Add any number of media URLs or upload files to the configured media storage.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Field label="Logo image URL"><Input value={draft.logoUrl} onChange={(event) => updateDraft((current) => ({ ...current, logoUrl: event.target.value }))} /></Field>
                  <MediaUploadInput accept="image/jpeg,image/png,image/webp,image/gif,image/avif" uploadPath={mediaUploadPath} onUploaded={(logoUrl) => updateDraft((current) => ({ ...current, logoUrl }))} />
                </div>
                <div className="space-y-2">
                  <Field label="Cover image URL"><Input value={draft.coverImageUrl} onChange={(event) => updateDraft((current) => ({ ...current, coverImageUrl: event.target.value }))} /></Field>
                  <MediaUploadInput accept="image/jpeg,image/png,image/webp,image/gif,image/avif" uploadPath={mediaUploadPath} onUploaded={(coverImageUrl) => updateDraft((current) => ({ ...current, coverImageUrl }))} />
                </div>
              </div>
              <DynamicTextList
                label="Gallery images"
                items={draft.galleryImages}
                placeholder="Image URL"
                addLabel="Add Image"
                onChange={(galleryImages) => updateDraft((current) => ({ ...current, galleryImages }))}
              />
              {draft.galleryImages.map((_, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <span className="text-xs text-muted-foreground">Upload image {index + 1}</span>
                  <MediaUploadInput accept="image/jpeg,image/png,image/webp,image/gif,image/avif" uploadPath={mediaUploadPath} onUploaded={(url) => updateDraft((current) => ({ ...current, galleryImages: current.galleryImages.map((image, itemIndex) => itemIndex === index ? url : image) }))} />
                </div>
              ))}
              <DynamicTextList
                label="Videos"
                items={draft.videoUrls}
                placeholder="Video URL"
                addLabel="Add Video"
                onChange={(videoUrls) => updateDraft((current) => ({ ...current, videoUrls }))}
              />
              {draft.videoUrls.map((_, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <span className="text-xs text-muted-foreground">Upload video {index + 1}</span>
                  <MediaUploadInput accept="video/mp4,video/webm,video/quicktime" uploadPath={mediaUploadPath} onUploaded={(url) => updateDraft((current) => ({ ...current, videoUrls: current.videoUrls.map((video, itemIndex) => itemIndex === index ? url : video) }))} />
                </div>
              ))}
            </Card>

              </TabsContent>

              <TabsContent value="courses" className="mt-4 space-y-4">
            <Card className="premium-card space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="font-semibold">Courses, Fees, and Placements</h3><p className="text-sm text-muted-foreground">Manage the programs and their fee and placement information.</p></div>
                <Button type="button" variant="outline" size="sm" onClick={() => updateDraft((current) => ({ ...current, courses: [...current.courses, emptyCourse()] }))}><Plus className="h-4 w-4" /> Add Course</Button>
              </div>
              {draft.courses.map((course, index) => (
                <div key={index} className="space-y-4 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Course {index + 1}</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => updateDraft((current) => ({ ...current, courses: current.courses.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 className="h-4 w-4" /> Remove</Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Course name"><Input required value={course.courseName} onChange={(event) => updateDraft((current) => ({ ...current, courses: current.courses.map((item, i) => i === index ? { ...item, courseName: event.target.value } : item) }))} /></Field>
                    <Field label="Branch / specialization"><Input required value={course.branchName} onChange={(event) => updateDraft((current) => ({ ...current, courses: current.courses.map((item, i) => i === index ? { ...item, branchName: event.target.value } : item) }))} /></Field>
                    <NumberField label="Duration (years)" value={course.durationYears} onChange={(value) => updateDraft((current) => ({ ...current, courses: current.courses.map((item, i) => i === index ? { ...item, durationYears: value } : item) }))} min={1} />
                    <Field label="Eligibility"><Input value={course.eligibility} onChange={(event) => updateDraft((current) => ({ ...current, courses: current.courses.map((item, i) => i === index ? { ...item, eligibility: event.target.value } : item) }))} /></Field>
                    <Field label="Entrance exam"><Input value={course.entranceExam} onChange={(event) => updateDraft((current) => ({ ...current, courses: current.courses.map((item, i) => i === index ? { ...item, entranceExam: event.target.value } : item) }))} /></Field>
                    <NumberField label="Seats" value={course.seats} onChange={(value) => updateDraft((current) => ({ ...current, courses: current.courses.map((item, i) => i === index ? { ...item, seats: value } : item) }))} min={0} />
                  </div>
                  <p className="text-sm font-medium">Yearly fees</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {([
                      ["Tuition", "tuitionFeeYearly"], ["Hostel", "hostelFeeYearly"], ["Mess", "messFeeYearly"],
                      ["Exam", "examFeeYearly"], ["Transport", "transportFeeYearly"], ["Other charges", "otherChargesYearly"],
                      ["Total annual cost", "totalAnnualCost"], ["Total course cost", "totalCourseCost"],
                    ] as const).map(([label, key]) => (
                      <NumberField key={key} label={label} value={course.fees[key]} onChange={(value) => updateDraft((current) => ({ ...current, courses: current.courses.map((item, i) => i === index ? { ...item, fees: { ...item.fees, [key]: value } } : item) }))} min={0} />
                    ))}
                  </div>
                  {mode === "admin" ? <>
                    <p className="text-sm font-medium">Placements</p>
                    <CoursePlacementFields
                      placement={course.placements}
                      onChange={(placements) => updateDraft((current) => ({ ...current, courses: current.courses.map((item, i) => i === index ? { ...item, placements } : item) }))}
                    />
                  </> : null}
                </div>
              ))}
              {draft.courses.length === 0 ? <p className="text-sm text-muted-foreground">No courses added yet.</p> : null}
            </Card>

              </TabsContent>

              <TabsContent value="placements" className="mt-4 space-y-4">
                <Card className="premium-card space-y-5 p-5">
                  <div>
                    <h3 className="font-semibold">Placement Statistics</h3>
                    <p className="text-sm text-muted-foreground">Update packages, placement rates, and recruiters for each program.</p>
                  </div>
                  {draft.courses.map((course, index) => (
                    <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                      <h4 className="font-medium">{course.courseName || `Course ${index + 1}`} · {course.branchName || "Branch not set"}</h4>
                      <CoursePlacementFields
                        placement={course.placements}
                        onChange={(placements) => updateDraft((current) => ({ ...current, courses: current.courses.map((item, i) => i === index ? { ...item, placements } : item) }))}
                      />
                    </div>
                  ))}
                  {draft.courses.length === 0 ? <p className="text-sm text-muted-foreground">Add a course before entering placement statistics.</p> : null}
                </Card>
              </TabsContent>

              <TabsContent value="scholarships" className="mt-4 space-y-5">
            <Card className="premium-card space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="font-semibold">Scholarships</h3><p className="text-sm text-muted-foreground">Manage scholarship names, eligibility, and amounts.</p></div>
                <Button type="button" variant="outline" size="sm" onClick={() => updateDraft((current) => ({ ...current, scholarships: [...current.scholarships, { title: "", description: "", eligibility: "", amount: 0, scholarshipAvailable: true }] }))}><Plus className="h-4 w-4" /> Add Scholarship</Button>
              </div>
              {draft.scholarships.map((scholarship, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
                  <Field label="Title"><Input value={scholarship.title} onChange={(event) => updateDraft((current) => ({ ...current, scholarships: current.scholarships.map((item, i) => i === index ? { ...item, title: event.target.value } : item) }))} /></Field>
                  <NumberField label="Amount" value={scholarship.amount} onChange={(value) => updateDraft((current) => ({ ...current, scholarships: current.scholarships.map((item, i) => i === index ? { ...item, amount: value } : item) }))} min={0} />
                  <Field label="Eligibility"><Input value={scholarship.eligibility} onChange={(event) => updateDraft((current) => ({ ...current, scholarships: current.scholarships.map((item, i) => i === index ? { ...item, eligibility: event.target.value } : item) }))} /></Field>
                  <Field label="Description"><Input value={scholarship.description} onChange={(event) => updateDraft((current) => ({ ...current, scholarships: current.scholarships.map((item, i) => i === index ? { ...item, description: event.target.value } : item) }))} /></Field>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={scholarship.scholarshipAvailable} onCheckedChange={(value) => updateDraft((current) => ({ ...current, scholarships: current.scholarships.map((item, i) => i === index ? { ...item, scholarshipAvailable: value } : item) }))} /> Available</label>
                  <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => updateDraft((current) => ({ ...current, scholarships: current.scholarships.filter((_, i) => i !== index) }))}><Trash2 className="h-4 w-4" /> Remove</Button>
                </div>
              ))}
            </Card>

            <Card className="premium-card space-y-4 p-5">
              <h3 className="font-semibold">Hostel</h3>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm"><Switch checked={draft.hostel.boysHostelAvailable} onCheckedChange={(value) => updateDraft((current) => ({ ...current, hostel: { ...current.hostel, boysHostelAvailable: value } }))} /> Boys hostel</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={draft.hostel.girlsHostelAvailable} onCheckedChange={(value) => updateDraft((current) => ({ ...current, hostel: { ...current.hostel, girlsHostelAvailable: value } }))} /> Girls hostel</label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DynamicTextList label="Room types" items={draft.hostel.roomTypes} placeholder="Room type" addLabel="Add Room Type" onChange={(roomTypes) => updateDraft((current) => ({ ...current, hostel: { ...current.hostel, roomTypes } }))} />
                <DynamicTextList label="Facilities" items={draft.hostel.facilities} placeholder="Facility" addLabel="Add Facility" onChange={(facilities) => updateDraft((current) => ({ ...current, hostel: { ...current.hostel, facilities } }))} />
                <NumberField label="Yearly fee" value={draft.hostel.yearlyFee} onChange={(value) => updateDraft((current) => ({ ...current, hostel: { ...current.hostel, yearlyFee: value } }))} min={0} />
              </div>
            </Card>

              </TabsContent>

              <TabsContent value="reviews" className="mt-4 space-y-4">
            <Card className="premium-card space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="font-semibold">Reviews</h3><p className="text-sm text-muted-foreground">Review changes replace the college&apos;s current review list.</p></div>
                <Button type="button" variant="outline" size="sm" onClick={() => updateDraft((current) => ({ ...current, reviews: [...current.reviews, emptyReview()] }))}><Plus className="h-4 w-4" /> Add Review</Button>
              </div>
              {draft.reviews.map((review, index) => (
                <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between"><h4 className="font-medium">Review {index + 1}</h4><Button type="button" variant="ghost" size="sm" onClick={() => updateDraft((current) => ({ ...current, reviews: current.reviews.filter((_, i) => i !== index) }))}><Trash2 className="h-4 w-4" /> Remove</Button></div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Student name"><Input value={review.studentName} onChange={(event) => updateDraft((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, studentName: event.target.value } : item) }))} /></Field>
                    {([
                      ["Overall", "rating"], ["Academics", "academicsRating"], ["Placements", "placementRating"],
                      ["Hostel", "hostelRating"], ["Campus", "campusRating"],
                    ] as const).map(([label, key]) => (
                      <NumberField key={key} label={`${label} rating`} value={review[key]} onChange={(value) => updateDraft((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, [key]: value } : item) }))} min={0} max={5} step={0.1} />
                    ))}
                  </div>
                  <Field label="Review"><Textarea value={review.reviewText} onChange={(event) => updateDraft((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, reviewText: event.target.value } : item) }))} /></Field>
                </div>
              ))}
            </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setDraft(null); setEditingId(null); }}>Cancel</Button>
              <Button type="submit" disabled={saving}><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save College"}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-semibold">College Information</h2><p className="text-sm text-muted-foreground">Add, edit, and manage college details shown across the website.</p></div>
              <Button onClick={startCreate}><Plus className="h-4 w-4" /> Add College</Button>
            </div>
            <div className="grid gap-3">
              {colleges.map((college) => (
                <Card key={college.id} className="premium-card flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {college.logo_url ? <Image src={college.logo_url} alt="" width={48} height={48} unoptimized className="h-12 w-12 rounded-lg border border-border object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></span>}
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{college.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{college.city}, {college.state} · {college.courses.length} courses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${college.isVisible ? "text-primary" : "text-muted-foreground"}`}>{college.isVisible ? "Visible" : "Hidden"}</span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/college/${college.slug}${college.isVisible ? "" : "?preview=admin"}`} target="_blank">
                        <ExternalLink className="h-4 w-4" /> View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => startEdit(college)}><Pencil className="h-4 w-4" /> Edit</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                <Eye className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-2xl font-bold">College Visibility</h2>
                <p className="text-sm text-muted-foreground">Hidden colleges remain available to administrators but are removed from public search results.</p>
              </div>
            </div>
            <label className="relative block w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={visibilitySearch}
                onChange={(event) => setVisibilitySearch(event.target.value)}
                placeholder="Search colleges..."
                className="rounded-full border-border bg-background/60 pl-10"
                aria-label="Search colleges"
              />
            </label>
          </div>
          <div className="space-y-2">
            {colleges
              .filter((college) => `${college.name} ${college.city} ${college.state}`.toLowerCase().includes(visibilitySearch.trim().toLowerCase()))
              .map((college) => {
                const image = college.cover_image_url || college.gallery_images[0] || college.logo_url;
                return (
                  <Card key={college.id} className="premium-card flex min-h-24 items-center justify-between gap-4 rounded-2xl p-4 sm:px-5">
                    <div className="flex min-w-0 items-center gap-4">
                      {image ? (
                        <Image src={image} alt="" width={60} height={60} unoptimized className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover" />
                      ) : (
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-border bg-background/60 text-primary">
                          <Building2 className="h-6 w-6" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{college.name}</p>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{college.city}, {college.state}</span>
                        </p>
                      </div>
                    </div>
                    <label className="flex shrink-0 items-center gap-3">
                      <span className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${college.isVisible ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background/60 text-muted-foreground"}`}>
                        {college.isVisible ? "Visible" : "Hidden"}
                      </span>
                      <Switch
                        checked={college.isVisible}
                        onCheckedChange={(isVisible) => toggleVisibility(college, isVisible)}
                        aria-label={`${college.isVisible ? "Hide" : "Show"} ${college.name}`}
                      />
                    </label>
                  </Card>
                );
              })}
            {colleges.length > 0 && !colleges.some((college) => `${college.name} ${college.city} ${college.state}`.toLowerCase().includes(visibilitySearch.trim().toLowerCase())) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No colleges match your search.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
