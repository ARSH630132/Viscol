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
  courses: {
    select: { courseName: true, branchName: true },
    take: 5,
  },
  fees: {
    select: { totalAnnualCost: true },
    orderBy: { totalAnnualCost: "asc" },
    take: 1,
  },
  placements: {
    select: { averagePackage: true, placementPercentage: true },
    orderBy: { averagePackage: "desc" },
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

  const courses = college.courses.map((course) => (
    course.branchName ? `${course.courseName} (${course.branchName})` : course.courseName
  )).filter(Boolean);
  if (courses.length) lines.push(`   Courses: ${courses.join(", ")}`);
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

async function detectCity(text) {
  const colleges = await prisma.college.findMany({
    where: { isVisible: true },
    select: { city: true },
    distinct: ["city"],
  });

  const cities = colleges
    .map((entry) => entry.city)
    .sort((a, b) => b.length - a.length);

  const cityAliases = {
    lucknow: ["lko"],
  };

  return cities.find((city) => {
    const cityLower = city.toLowerCase();
    const normalizedText = ` ${text.toLowerCase().replace(/[^\w\s]/g, " ")} `;
    if (normalizedText.includes(` ${cityLower} `)) return true;
    return (cityAliases[cityLower] || []).some((alias) => normalizedText.includes(` ${alias} `));
  });
}

async function queryColleges({ where = {}, orderBy = { rating: "desc" }, take = LIST_LIMIT } = {}) {
  return prisma.college.findMany({
    where: { AND: [{ isVisible: true }, where] },
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

function normalizeCollegeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function findMentionedColleges(messages) {
  const conversation = normalizeCollegeText(messages.map((message) => message.content).join(" "));
  const candidateWords = [...new Set(conversation.split(" ").filter((word) => word.length >= 3 && !STOPWORDS.has(word)))].slice(-40);
  if (!candidateWords.length) return [];

  const matches = await Promise.all(candidateWords.map((word) => prisma.college.findMany({
    where: { isVisible: true, name: { contains: word, mode: "insensitive" } },
    take: 10,
    select: collegeCardSelect,
  })));
  const colleges = [...new Map(matches.flat().map((college) => [college.id, college])).values()];
  return colleges
    .filter((college) => {
      const name = normalizeCollegeText(college.name);
      return name.length >= 3 && ` ${conversation} `.includes(` ${name} `);
    })
    .slice(0, 3);
}

function compareCollegeScore(college, maxima) {
  const ratingScore = Number(college.rating) / 5;
  const placementScore = maxima.placement
    ? Number(college.placements[0]?.averagePackage || 0) / maxima.placement
    : 0;
  const feeScore = maxima.fee && college.fees[0]?.totalAnnualCost
    ? 1 - college.fees[0].totalAnnualCost / maxima.fee
    : 0;
  return ratingScore * 0.4 + placementScore * 0.35 + feeScore * 0.25;
}

export async function generateCollegeDataReply(messages) {
  const latestQuestion = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const text = latestQuestion.toLowerCase().trim();
  const compareIntent = /\b(compare|comparison|versus|vs)\b/.test(text);

  if (compareIntent) {
    const colleges = await findMentionedColleges(messages);
    if (colleges.length < 2) {
      return "Which colleges would you like me to compare? Please include at least two college names, and I’ll compare their ratings, fees, and placement data.";
    }

    const maxima = {
      placement: Math.max(...colleges.map((college) => Number(college.placements[0]?.averagePackage || 0))),
      fee: Math.max(...colleges.map((college) => college.fees[0]?.totalAnnualCost || 0)),
    };
    const ranked = [...colleges].sort((first, second) => compareCollegeScore(second, maxima) - compareCollegeScore(first, maxima));
    const recommendation = ranked[0];
    const details = colleges.map((college, index) => {
      const fee = college.fees[0]?.totalAnnualCost;
      const placement = college.placements[0]?.averagePackage;
      return [
        `${index + 1}. ${college.name} (${college.city})`,
        `   Rating: ${Number(college.rating).toFixed(1)}/5`,
        fee ? `   Lowest annual fee: ₹${fee.toLocaleString("en-IN")}` : "   Fee: not available",
        placement ? `   Average package: ₹${Number(placement).toFixed(1)} LPA` : "   Placement package: not available",
      ].join("\n");
    });

    return `College comparison:\n\n${details.join("\n\n")}\n\nBest overall based on the available rating, placement, and fee data: ${recommendation.name}.`;
  }

  const course = detectCourse(text);
  const budget = parseBudget(text);
  const scholarshipOnly = /scholarship|financial aid|fee waiver/.test(text);
  const placementIntent = /placement|package|lpa|salary|recruit/.test(text);
  const collegeIntent = /\b(college|colleges|university|universities|institute|institutes|top|best|recommend|compare)\b/.test(text);

  if (!collegeIntent && !course && !budget && !scholarshipOnly && !placementIntent) return null;
  const city = await detectCity(text);

  const conditions = [];
  if (city) conditions.push({ city: { equals: city, mode: "insensitive" } });
  if (course) {
    conditions.push({
      courses: {
        some: {
          OR: [
            { courseName: { contains: course, mode: "insensitive" } },
            { branchName: { contains: course === "B.Tech" ? "engineering" : course, mode: "insensitive" } },
          ],
        },
      },
    });
  }
  if (budget) conditions.push({ fees: { some: { totalAnnualCost: { lte: budget } } } });
  if (scholarshipOnly) conditions.push({ scholarships: { some: { scholarshipAvailable: true } } });

  let colleges = await queryColleges({
    where: conditions.length ? { AND: conditions } : {},
    take: placementIntent ? 100 : 20,
  });

  if (placementIntent) {
    colleges = colleges
      .sort((first, second) => Number(second.placements[0]?.averagePackage || 0) - Number(first.placements[0]?.averagePackage || 0))
      .slice(0, LIST_LIMIT);
  } else {
    colleges = colleges.slice(0, LIST_LIMIT);
  }

  const description = [
    city ? `in ${city}` : "",
    course ? `offering ${course}` : "",
    budget ? `under ₹${budget.toLocaleString("en-IN")}/year` : "",
    scholarshipOnly ? "with scholarships" : "",
  ].filter(Boolean).join(" ");

  if (!colleges.length) {
    return `I couldn’t find visible colleges ${description || "matching that request"} in the current college data. Try changing the city, course, or budget.`;
  }

  const title = placementIntent
    ? `Colleges${description ? ` ${description}` : ""}, ranked by placement package:`
    : `Top colleges${description ? ` ${description}` : ""}:`;
  return formatCollegeList(title, colleges);
}

export async function generateLocalReply(message) {
  const text = message.toLowerCase().trim();
  const keywords = extractKeywords(text);

  if (/how (do|can|to)|\bapply\b|admission|register/.test(text)) {
    return "To apply on Viscol: register with OTP at /register, browse colleges at /colleges, add favourites to your wishlist, then submit the application form at /apply with your course and budget preferences.";
  }

  if (/compare|comparison|\bvs\b|versus/.test(text)) {
    return "Use Viscol Compare to view up to 3 colleges side by side · fees, placements, scholarships, and hostel details. Open any college page and tap Compare, or go directly to /compare.";
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
      where: { isVisible: true },
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
    const total = await prisma.college.count({ where: { isVisible: true } });
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

  const total = await prisma.college.count({ where: { isVisible: true } });
  const diverseColleges = await getDiverseColleges(LIST_LIMIT);

  return (
    formatCollegeList(`We have ${total} colleges on Viscol. Here are options across different cities:`, diverseColleges) +
    "\n\nTry asking: \"Colleges in Lucknow\", \"B.Tech colleges under ₹2L\", or \"Best placement colleges\"."
  );
}
