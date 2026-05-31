import type { GeneratedClipDto } from "@/lib/types";
import { demoPlaceholder } from "@/lib/demo-placeholder";

const titles = [
  "The Hook That Stops the Scroll",
  "One Insight Everyone Missed",
  "Fast Breakdown for Busy Creators",
  "Before You Skip This Strategy",
  "The Moment That Changes Everything",
  "High Retention Clip Blueprint",
  "Creator Shortcut Worth Testing",
  "The 45 Second Growth Angle",
  "Clean Takeaway From the Full Video",
  "Best Part for Short-Form Reach"
];

const descriptions = [
  "A punchy excerpt with a direct opening, clear payoff, and creator-friendly caption pacing.",
  "Designed as a high-retention short with a strong first sentence and compact story arc.",
  "Highlights the most reusable moment from the source video for cross-platform publishing.",
  "A concise clip package with context, tension, and a CTA-ready closing beat."
];

export function createDummyClips(count: number, duration: number, sourceTitle: string): GeneratedClipDto[] {
  return Array.from({ length: count }, (_, index) => {
    const score = Math.min(98, 72 + ((index * 7 + duration) % 24));
    return {
      id: `clip_${Date.now()}_${index + 1}`,
      title: `${titles[index % titles.length]} #${index + 1}`,
      description: `${descriptions[index % descriptions.length]} Source: ${sourceTitle}.`,
      thumbnail: demoPlaceholder(`Clip ${index + 1}`, 720, 1280),
      duration,
      viralScore: score,
      tags: ["ai-clipper", "shorts", "viral", "creator"]
    };
  });
}
