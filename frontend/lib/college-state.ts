import type { Course, CollegeType, PlacementPreference } from "@/lib/college-data";

export interface SearchFilters {
  course: Course;
  state: string;
  city: string;
  budget: number;
  collegeTypes: CollegeType[];
  placementPreference: PlacementPreference;
  scholarshipOnly: boolean;
}

const SEARCH_KEY = "college-visitor-search";
const COMPARE_KEY = "college-visitor-compare";
const WISHLIST_KEY = "college-visitor-wishlist";
const EVENT_NAME = "college-visitor-state-change";

export const defaultSearchFilters: SearchFilters = {
  course: "B.Tech",
  state: "",
  city: "",
  budget: 300000,
  collegeTypes: ["Government", "Private"],
  placementPreference: "Above 4 LPA",
  scholarshipOnly: false,
};

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  return safeParse<T>(window.localStorage.getItem(key), fallback);
};

const writeJson = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const searchState = {
  get: () => readJson<SearchFilters>(SEARCH_KEY, defaultSearchFilters),
  set: (filters: SearchFilters) => writeJson<SearchFilters>(SEARCH_KEY, filters),
};

export const compareState = {
  get: () => readJson<number[]>(COMPARE_KEY, []),
  set: (ids: number[]) => writeJson<number[]>(COMPARE_KEY, ids.slice(0, 3)),
};

export const wishlistState = {
  get: () => readJson<number[]>(WISHLIST_KEY, []),
  set: (ids: number[]) => writeJson<number[]>(WISHLIST_KEY, ids),
};

export const COLLEGE_STATE_EVENT = EVENT_NAME;
