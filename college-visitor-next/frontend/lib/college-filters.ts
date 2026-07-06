import type { College, PlacementPreference } from "@/lib/college-data";
import type { SearchFilters } from "@/lib/college-state";

export type SortOption =
  | "recommended"
  | "feesLowToHigh"
  | "feesHighToLow"
  | "highestPlacement"
  | "highestRating"
  | "lowestTotalCost";

export const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "recommended", label: "Recommended" },
  { value: "feesLowToHigh", label: "Fees Low to High" },
  { value: "feesHighToLow", label: "Fees High to Low" },
  { value: "highestPlacement", label: "Highest Placement" },
  { value: "highestRating", label: "Highest Rating" },
  { value: "lowestTotalCost", label: "Lowest Total Cost" },
];

const placementThreshold = (value: PlacementPreference) => {
  if (value === "Above 10 LPA") return 10;
  if (value === "Above 6 LPA") return 6;
  return 4;
};

export const filterColleges = (input: College[], filters: SearchFilters) => {
  const threshold = placementThreshold(filters.placementPreference);

  return input.filter((college) => {
    if (college.course !== filters.course) return false;
    if (filters.state && college.state !== filters.state) return false;
    if (filters.city && college.city !== filters.city) return false;
    if (college.annualCost > filters.budget) return false;
    if (filters.collegeTypes.length > 0 && !filters.collegeTypes.includes(college.collegeType)) return false;
    if (college.averagePackageLpa < threshold) return false;
    if (filters.scholarshipOnly && !college.scholarshipAvailable) return false;
    return true;
  });
};

export const sortColleges = (input: College[], sortBy: SortOption) => {
  const list = [...input];

  if (sortBy === "feesLowToHigh" || sortBy === "lowestTotalCost") {
    return list.sort((a, b) => a.annualCost - b.annualCost);
  }
  if (sortBy === "feesHighToLow") {
    return list.sort((a, b) => b.annualCost - a.annualCost);
  }
  if (sortBy === "highestPlacement") {
    return list.sort((a, b) => b.averagePackageLpa - a.averagePackageLpa);
  }
  if (sortBy === "highestRating") {
    return list.sort((a, b) => b.rating - a.rating);
  }

  return list.sort((a, b) => b.rating + b.placementRate / 100 - (a.rating + a.placementRate / 100));
};
