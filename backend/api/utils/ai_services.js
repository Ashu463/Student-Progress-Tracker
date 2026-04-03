import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
console.log("api key is: ", process.env.GEMINI_API_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // ✅ fixed model
// Formats raw student DB data into clean AI context
const buildStudentContext = (student) => {
  const tagStats = {};

  (student.solvedProblems || []).forEach((p) => {
    (p.tags || []).forEach((tag) => {
      if (!tagStats[tag]) tagStats[tag] = { attempted: 0, solved: 0 };
      tagStats[tag].attempted++;
      if (p.verdict === "OK") tagStats[tag].solved++;
    });
  });

  return {
    handle: student.codeforcesHandle,
    currentRating: student.currentRating,
    maxRating: student.maxRating,
    recentContests: (student.contestHistory || []).slice(-5),
    tagStats,
    totalSolved: (student.solvedProblems || []).filter(
      (p) => p.verdict === "OK"
    ).length,
    lastActive: student.lastActive,
  };
};

// AI Performance Coach
const getCoachInsights = async (student) => {
  const context = buildStudentContext(student);

  const prompt = `
You are an expert competitive programming coach. Analyze this student's Codeforces profile and give 4 specific, actionable insights. Be direct and encouraging. Format response as JSON array of objects with keys: "title" (short, 4-6 words), "insight" (2-3 sentences), "priority" (high/medium/low).

Student Data:
${JSON.stringify(context, null, 2)}

Return ONLY valid JSON array, no markdown.
`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  return JSON.parse(raw);
};

// Problem Recommender
const getRecommendedProblems = async (student, problemPool) => {
  const context = buildStudentContext(student);

  const solvedIds = new Set(
    (student.solvedProblems || [])
      .filter((p) => p.verdict === "OK")
      .map((p) => `${p.contestId}${p.index}`)
  );

  const rating = student.currentRating || 1200;

  const filtered = problemPool
    .filter((p) => {
      const id = `${p.contestId}${p.index}`;
      return (
        !solvedIds.has(id) &&
        p.rating >= rating - 100 &&
        p.rating <= rating + 300
      );
    })
    .slice(0, 50);

  const prompt = `
You are a competitive programming mentor. From this problem pool, recommend exactly 5 problems for this student. Format as JSON array with keys: "contestId", "index", "name", "rating", "tags", "reason" (1-2 sentences why this problem fits them).

Student Profile:
${JSON.stringify(context, null, 2)}

Problem Pool (pick 5):
${JSON.stringify(filtered, null, 2)}

Return ONLY valid JSON array, no markdown.
`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

// Weekly digest summary for email
const getWeeklySummary = async (student) => {
  const context = buildStudentContext(student);

  const prompt = `
Write a short, motivating weekly digest for this competitive programmer. 3-4 sentences max. Mention their actual stats. End with one specific thing to focus on this week. Be friendly, not robotic.

Student:
${JSON.stringify(context, null, 2)}

Return plain text only.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export {
  getCoachInsights,
  getRecommendedProblems,
  getWeeklySummary
};