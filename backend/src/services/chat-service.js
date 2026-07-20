import { prisma } from "../db.js";
import { generateLocalReply } from "./chat-fallback.js";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
const CONTEXT_TTL_MS = 5 * 60 * 1000;

let cachedContext = { text: "", expiresAt: 0 };

async function getCollegeContextSummary() {
  if (cachedContext.text && Date.now() < cachedContext.expiresAt) {
    return cachedContext.text;
  }

  try {
    const colleges = await prisma.college.findMany({
      take: 20,
      orderBy: { rating: "desc" },
      select: {
        name: true,
        city: true,
        state: true,
        collegeType: true,
        rating: true,
        courses: { select: { courseName: true, branchName: true }, take: 2 },
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
      },
    });

    const lines = colleges.map((college) => {
      const courses = college.courses
        .map((c) => c.branchName || c.courseName)
        .join(", ");
      const minFee = college.fees[0]?.totalAnnualCost;
      const placement = college.placements[0];
      const scholarship = college.scholarships[0]?.title;

      return [
        `- ${college.name} (${college.city}, ${college.state})`,
        `  Type: ${college.collegeType}, Rating: ${Number(college.rating).toFixed(1)}`,
        courses ? `  Courses: ${courses}` : null,
        minFee ? `  Min annual fee: ₹${minFee.toLocaleString("en-IN")}` : null,
        placement
          ? `  Avg package: ₹${Number(placement.averagePackage).toLocaleString("en-IN")} LPA, Placements: ${Number(placement.placementPercentage)}%`
          : null,
        scholarship ? `  Scholarship: ${scholarship}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    });

    const text = lines.join("\n\n");
    cachedContext = { text, expiresAt: Date.now() + CONTEXT_TTL_MS };
    return text;
  } catch (error) {
    console.warn("Chat college context unavailable:", error.message);
    return "";
  }
}

function buildSystemPrompt(collegeContext) {
  return `You are Viscol Assistant — a friendly, concise college advisor for the Viscol (College Visitor) platform in India.

Help students with:
- Finding colleges by course, city, state, budget, or placements
- Comparing colleges and understanding fees, scholarships, and hostel options
- Admission guidance and using Viscol features (search, compare, wishlist, apply)

Rules:
- Keep answers short and practical (2–4 sentences unless listing colleges)
- Use ₹ for Indian currency; mention LPA for packages
- When listing colleges, use numbered entries with each detail on its own line
- Use blank lines between college entries for readability
- If unsure, say so and suggest browsing /colleges or contacting support
- Stay focused on education and Viscol; politely decline off-topic requests

Sample colleges in our database:
${collegeContext || "No college data loaded yet."}`;
}

function toGeminiContents(messages) {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
}

async function tryGeminiReply(messages, collegeContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const primaryModel = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const models = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  const body = {
    systemInstruction: {
      parts: [{ text: buildSystemPrompt(collegeContext) }],
    },
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  for (const model of models) {
    const url = `${GEMINI_API_URL}/${model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      continue;
    }

    if (response.ok) {
      const reply = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (reply) return reply;
    }

    const message = payload?.error?.message || "";
    const retryable =
      response.status === 429 ||
      /quota|rate limit|not found|unsupported/i.test(message);

    if (!retryable) break;
  }

  return null;
}

export async function generateChatReply(messages) {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const collegeContext = await getCollegeContextSummary();

  const geminiReply = await tryGeminiReply(messages, collegeContext);
  if (geminiReply) return geminiReply;

  console.warn("Gemini unavailable, using local college assistant fallback");
  return generateLocalReply(lastUserMessage);
}
