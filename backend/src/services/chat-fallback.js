import { prisma } from "../db.js";

const LIST_LIMIT = 5;

const collegeCardSelect = {
  id: true,
  name: true,
  slug: true,
  city: true,
  state: true,
  collegeType: true,
  rating: true,
  fees: {
    select: { totalAnnualCost: true },
    orderBy: { totalAnnualCost: "asc" },
    take: 1,
  },
  placements: {
    select: { averagePackage: true, placementPercentage: true },
    take: 1,
  },
  scholarships: {
    select: { title: true },
    where: { scholarshipAvailable: true },
    take: 1,
  },
};

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "want",
  "tell", "give", "show", "list", "find", "search", "get", "know",
  "about", "for", "with", "from", "into", "during", "before", "after",
  "above", "below", "between", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "each",
  "few", "more", "most", "other", "some", "such", "only", "own", "same",
  "so", "than", "too", "very", "just", "also", "now", "me", "my", "your",
  "you", "i", "we", "they", "what", "which", "who", "whom", "this", "that",
  "these", "those", "please", "help", "any", "good", "best", "top", "recommend",
  "suggest", "college", "colleges", "university", "universities", "institute",
  "institutes", "school", "viscol", "platform",
]);

function formatCollege(college, index) {
  const fee = college.fees[0]?.totalAnnualCost;
  const placement = college.placements[0];
  const lines = [
    `${index + 1}. ${college.name} (${college.city})`,
    `   Rating: ${Number(college.rating).toFixed(1)} · ${college.collegeType}`,
  ];

  if (fee) lines.push(`   Fee: ~₹${fee.toLocaleString("en-IN")}/year`);
  if (placement) {
    lines.push(
      `   Package: ₹${Number(placement.averagePackage).toFixed(1)} LPA · ${Number(placement.placementPercentage)}% placed`,
    );
  }
  if (college.scholarships[0]) {
    lines.push(`   Scholarship: ${college.scholarships[0].title}`);
  }

  return lines.join("\n");
}

function formatCollegeList(title, colleges) {
  return `${title}\n\n${colleges.map(formatCollege).join("\n\n")}`;
}

function parseBudget(text) {
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b/i);
  if (lakhMatch) return Math.round(Number(lakhMatch[1]) * 100000);

  const amountMatch = text.match(/(?:₹|rs\.?)\s*(\d[\d,]*)\s*(k|lakh|lac|l)?/i);
  if (amountMatch) {
    let raw = Number(amountMatch[1].replace(/,/g, ""));
    const unit = (amountMatch[2] || "").toLowerCase();
    if (unit === "k") raw *= 1000;
    if (unit === "lakh" || unit === "lac" || unit === "l") raw *= 100000;
    return raw;
  }

  return null;
}

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
}

function detectCourse(text) {
  if (/\bb\.?\s*tech\b|\bbtech\b|engineering|computer science|\bcse\b|\beit\b|\bece\b/.test(text)) {
    return "B.Tech";
  }
  if (/\bmba\b|management|business/.test(text)) {
    return "MBA";
  }
  return null;
}

async function detectCity(text, keywords = []) {
  const colleges = await prisma.college.findMany({
    select: { city: true },
    distinct: ["city"],
  });

  const cities = colleges
    .map((entry) => entry.city)
    .sort((a, b) => b.length - a.length);

  return cities.find((city) => {
    const cityLower = city.toLowerCase();
    if (text.includes(cityLower)) return true;
    return keywords.some(
      (keyword) => cityLower.includes(keyword) || keyword.includes(cityLower),
    );
  });
}

async function queryColleges({ where = {}, orderBy = { rating: "desc" }, take = LIST_LIMIT } = {}) {
  return prisma.college.findMany({
    where,
    orderBy,
    take,
    select: collegeCardSelect,
  });
}

async function getDiverseColleges(limit = LIST_LIMIT) {
  const all = await queryColleges({ take: 20 });

  const picked = [];
  const seenCities = new Set();

  for (const college of all) {
    const cityKey = college.city.toLowerCase();
    if (seenCities.has(cityKey)) continue;
    seenCities.add(cityKey);
    picked.push(college);
    if (picked.length >= limit) return picked;
  }

  for (const college of all) {
    if (picked.some((item) => item.id === college.id)) continue;
    picked.push(college);
    if (picked.length >= limit) break;
  }

  return picked;
}

async function searchByKeywords(keywords) {
  if (!keywords.length) return [];

  const orConditions = keywords.flatMap((keyword) => [
    { name: { contains: keyword, mode: "insensitive" } },
    { city: { contains: keyword, mode: "insensitive" } },
    { state: { contains: keyword, mode: "insensitive" } },
    {
      courses: {
        some: {
          OR: [
            { courseName: { contains: keyword, mode: "insensitive" } },
            { branchName: { contains: keyword, mode: "insensitive" } },
          ],
        },
      },
    },
  ]);

  return queryColleges({
    where: { OR: orConditions },
    take: LIST_LIMIT,
  });
}

export async function generateLocalReply(message) {
  const text = message.toLowerCase().trim();
  const keywords = extractKeywords(text);

  if (/how (do|can|to)|\bapply\b|admission|register/.test(text)) {
    return "To apply on Viscol: register with OTP at /register, browse colleges at /colleges, add favourites to your wishlist, then submit the application form at /apply with your course and budget preferences.";
  }

  if (/compare|comparison|\bvs\b|versus/.test(text)) {
    return "Use Viscol Compare to view up to 3 colleges side by side — fees, placements, scholarships, and hostel details. Open any college page and tap Compare, or go directly to /compare.";
  }

  if (/wishlist|save|bookmark|favourite|favorite/.test(text)) {
    return "Click the heart icon on any college card to save it to your wishlist. View all saved colleges anytime at /wishlist.";
  }

  if (/scholarship|financial aid|fee waiver/.test(text)) {
    const colleges = await queryColleges({
      where: { scholarships: { some: { scholarshipAvailable: true } } },
    });

    if (!colleges.length) {
      return "Browse /colleges and filter by scholarship to see colleges offering financial aid.";
    }

    return formatCollegeList("Colleges with scholarships available:", colleges) + "\n\nVisit /colleges for full details.";
  }

  const course = detectCourse(text);
  if (course) {
    const colleges = await queryColleges({
      where: {
        courses: { some: { courseName: { equals: course, mode: "insensitive" } } },
      },
    });

    return formatCollegeList(`Colleges offering ${course}:`, colleges);
  }

  const city = await detectCity(text, keywords);
  if (city) {
    const budget = parseBudget(text);
    const colleges = await queryColleges({
      where: {
        city: { equals: city, mode: "insensitive" },
        ...(budget
          ? { fees: { some: { totalAnnualCost: { lte: budget } } } }
          : {}),
      },
    });

    if (!colleges.length) {
      return budget
        ? `No colleges found in ${city} under ₹${budget.toLocaleString("en-IN")}/year. Try a higher budget or browse /colleges.`
        : `No colleges found in ${city}. Try browsing /colleges for all locations.`;
    }

    const title = budget
      ? `Colleges in ${city} under ~₹${budget.toLocaleString("en-IN")}/year:`
      : `Colleges in ${city}:`;

    return formatCollegeList(title, colleges);
  }

  const budget = parseBudget(text);
  if (budget || /\b(fee|fees|cost|afford|cheap|budget)\b/.test(text) || /\bunder\b/.test(text)) {
    const maxBudget = budget || 200000;
    const colleges = await queryColleges({
      where: { fees: { some: { totalAnnualCost: { lte: maxBudget } } } },
      orderBy: { rating: "desc" },
    });

    if (!colleges.length) {
      return `No colleges found under ₹${maxBudget.toLocaleString("en-IN")}/year. Try increasing your budget or browse all options at /colleges.`;
    }

    return formatCollegeList(`Colleges under ~₹${maxBudget.toLocaleString("en-IN")}/year:`, colleges);
  }

  if (/placement|package|lpa|salary|recruit/.test(text)) {
    const colleges = await prisma.college.findMany({
      take: 20,
      select: {
        ...collegeCardSelect,
        placements: {
          select: { averagePackage: true, placementPercentage: true },
          orderBy: { averagePackage: "desc" },
          take: 1,
        },
      },
    });

    colleges.sort(
      (a, b) =>
        Number(b.placements[0]?.averagePackage || 0) -
        Number(a.placements[0]?.averagePackage || 0),
    );

    return formatCollegeList("Top colleges by average package:", colleges.slice(0, LIST_LIMIT));
  }

  if (/\b(best|top|recommend|suggest|rated|popular)\b/.test(text)) {
    const colleges = await queryColleges({ orderBy: { rating: "desc" } });
    return formatCollegeList("Top-rated colleges on Viscol:", colleges);
  }

  if (/\b(all|total|how many|list every|every college)\b/.test(text)) {
    const colleges = await queryColleges({ take: 10 });
    const total = await prisma.college.count();
    return (
      formatCollegeList(`All ${total} colleges on Viscol:`, colleges) +
      (total > colleges.length ? `\n\nBrowse /colleges to see the full list.` : "")
    );
  }

  if (/hello|hi\b|hey|start|what can you/.test(text)) {
    return "Hi! I'm Viscol Assistant. Ask me about colleges by city (e.g. Lucknow, Noida), budget (e.g. under ₹2L), course (B.Tech or MBA), placements, or scholarships.";
  }

  const keywordMatches = await searchByKeywords(keywords);
  if (keywordMatches.length) {
    return formatCollegeList("Here's what I found:", keywordMatches);
  }

  const total = await prisma.college.count();
  const diverseColleges = await getDiverseColleges(LIST_LIMIT);

  return (
    formatCollegeList(`We have ${total} colleges on Viscol. Here are options across different cities:`, diverseColleges) +
    "\n\nTry asking: \"Colleges in Lucknow\", \"B.Tech colleges under ₹2L\", or \"Best placement colleges\"."
  );
}
