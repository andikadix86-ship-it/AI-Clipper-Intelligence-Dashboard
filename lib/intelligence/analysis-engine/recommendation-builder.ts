import type { IntelligenceMode, IntelligenceSearchResult } from "@/lib/intelligence/search-engine/types";

export function recommendationContent(result: IntelligenceSearchResult, mode: IntelligenceMode) {
  const topic = result.topic;
  if (mode === "affiliate") {
    return {
      audience: "Value-conscious buyers who need a clear use case before checkout.",
      contentGap: "Most affiliate content is generic. Show one concrete problem, a short product demo, and a direct CTA.",
      angles: [`Problem-solution demonstration for ${topic}`, `Before-after use case for ${topic}`, `Honest three-point review for ${topic}`],
      hooks: [`Masih mengalami masalah ini? Lihat cara ${topic} membantu.`, `Sebelum checkout, cek demo singkat ${topic} ini.`],
      formats: ["15-second product demo", "UGC review", "Problem-solution short"],
      actionPlan: ["Validate commission and seller quality manually.", "Create one vertical product demo.", "Send the strongest draft to approval."]
    };
  }
  return {
    audience: "Short-form audiences looking for practical, immediately useful ideas.",
    contentGap: "Create an original proof-first angle instead of repeating the public source.",
    angles: [`Three-step explanation of ${topic}`, `Mistakes to avoid when applying ${topic}`, `Proof-first walkthrough for ${topic}`],
    hooks: [`Tiga detik pertama: ini alasan ${topic} layak diperhatikan.`, `Jangan mulai sebelum memahami satu hal tentang ${topic}.`],
    formats: ["30-second educational short", "45-second proof walkthrough", "Clip plan with bold captions"],
    actionPlan: ["Choose one original angle.", "Draft a three-second hook.", "Generate the visual in Creative Studio.", "Send the result to review."]
  };
}

