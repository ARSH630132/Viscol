import { z } from "zod";

const firstQueryValue = (value) => (Array.isArray(value) ? value[0] : value);

const emptyToUndefined = (value) => {
  const first = firstQueryValue(value);
  return first === "" || first === null ? undefined : first;
};

const numberFromQuery = z.preprocess(emptyToUndefined, z.coerce.number().finite().optional());
const intFromQuery = z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional());
const stringFromQuery = z.preprocess(
  emptyToUndefined,
  z.coerce
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
);

const booleanFromQuery = z.preprocess((value) => {
  const first = emptyToUndefined(value);
  if (first === undefined || typeof first === "boolean") return first;
  if (typeof first === "number") return first === 1;
  return ["true", "1", "yes"].includes(String(first).toLowerCase());
}, z.boolean().optional());

export const collegeListQuerySchema = z.object({
  course: stringFromQuery,
  state: stringFromQuery,
  city: stringFromQuery,
  min_budget: numberFromQuery,
  max_budget: numberFromQuery,
  college_type: stringFromQuery,
  placement_min: numberFromQuery,
  scholarship: booleanFromQuery,
  sort_by: z
    .preprocess(
      emptyToUndefined,
      z
        .enum([
      "recommended",
      "fees_low_to_high",
      "fees_high_to_low",
      "placement_high_to_low",
      "rating_high_to_low",
      "lowest_total_cost",
    ])
        .default("recommended"),
    ),
  search: stringFromQuery,
  page: intFromQuery.default(1),
  limit: intFromQuery.default(12),
});

export const compareQuerySchema = z.object({
  ids: z
    .preprocess(firstQueryValue, z.coerce.string().min(1))
    .transform((value) =>
      value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((id) => Number.isInteger(id) && id > 0),
    )
    .refine((ids) => ids.length >= 1 && ids.length <= 3, "Compare requires 1 to 3 valid college IDs"),
});

export const applicationSchema = z.object({
  student_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(20),
  email: z.string().trim().email(),
  course: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  budget: z.number().int().positive(),
  preferred_college_id: z.number().int().positive().optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Mobile must be a valid 10-digit Indian number"),
  email: z.string().trim().toLowerCase().email("Email must be valid"),
});
