"use server";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: { responseMimeType: "application/json" }, // Force JSON response
});

export async function reportIncident(rawText, userId) {
  if (!rawText?.trim()) {
    return { success: false, error: "No report text received." };
  }
  const uid = typeof userId === "string" ? userId.trim() : "";
  if (!uid) {
    return { success: false, error: "Session invalid. Please log in again." };
  }

  let cleanSummary = "Voice Report";
  let severity = "LOW";

  try {
    console.log("🎤 1. Analyzing Context:", rawText);

    // --- AI Prompt: any language, careful severity analysis ---
    const prompt = `You are a Security Operations Center AI. A security guard has submitted a patrol incident report.

The report may be in ANY language (e.g. English, Hindi, Urdu, Arabic, Spanish, etc.). Understand the meaning regardless of language.

TASK:
1. Carefully analyze what happened based on the report.
2. Assign SEVERITY after considering context and urgency:
   - HIGH: Immediate danger to life or property—fire, smoke, intruders, weapons, medical emergency, chemical spill, person unconscious, violence, major power failure.
   - MED: Security or safety risk—unlocked/forced door, break-in, asset damage, water leak, electrical fault/sparking, suspicious person, vandalism.
   - LOW: Non-urgent—maintenance (burnt bulb, broken fixture), cleaning needed, lost property, parking issue, minor complaint.

3. Write a short summary in English (max 6 words) that describes the incident for the dashboard.

Guard report (original, any language):
"${rawText.replace(/"/g, '\\"')}"

Respond with ONLY valid JSON, no other text:
{"summary":"Your short title here","severity":"HIGH" or "MED" or "LOW"}`;

    // --- AI Execution ---
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = (response.text() || "").trim();

      console.log("🤖 2. AI Decision:", text);

      // Strip markdown code blocks if present
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) text = jsonMatch[0];

      const analysis = JSON.parse(text);
      const s = analysis.summary;
      const sev = analysis.severity;

      if (s && typeof s === "string") cleanSummary = s.slice(0, 80);
      if (sev && ["HIGH", "MED", "LOW"].includes(String(sev).toUpperCase())) {
        severity = String(sev).toUpperCase();
      }
    } catch (aiError) {
      console.error("⚠️ AI Failed (Using Keyword Backup):", aiError.message);

      // Backup: keyword check in original text (any language) for life-safety
      const lower = rawText.toLowerCase();
      const highKeywords = ["fire", "smoke", "blood", "weapon", "gun", "attack", "unconscious", "agaa", "dhuwan", "aag"];
      const medKeywords = ["break", "door open", "darwaza", "tuta", "leak", "spark"];
      if (highKeywords.some((k) => lower.includes(k))) severity = "HIGH";
      else if (medKeywords.some((k) => lower.includes(k))) severity = "MED";
    }

    // --- Save to Database ---
    const finalSummary = `[${severity}] ${cleanSummary}`;

    const user = await db.user.findUnique({ where: { id: uid }, select: { id: true } });
    if (!user) {
      return { success: false, error: "Session invalid. Please log out and log in again." };
    }

    await db.incident.create({
      data: {
        userId: uid,
        description: rawText.trim(),
        aiSummary: finalSummary,
      },
    });

    console.log("✅ 3. Incident Logged:", finalSummary);
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    const isForeignKey = error?.code === "P2003";
    if (!isForeignKey) console.error("❌ System Error:", error);
    return { success: false, error: isForeignKey ? "Session invalid. Please log in again." : "Failed to save incident." };
  }
}
