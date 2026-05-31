import { calculateGoogleTrendsScore } from "@/lib/intelligence/scoring";
import type { IntelligenceResultDto } from "@/lib/intelligence/types";

export type GoogleTrendsRequest = {
  keywords?: string[];
  region?: string;
  timeRange?: "7d" | "30d";
};

export interface GoogleTrendsAdapter {
  getInterestOverTime(keyword: string, region?: string, timeRange?: "7d" | "30d"): Promise<IntelligenceResultDto[]>;
  getRelatedQueries(keyword: string, region?: string, timeRange?: "7d" | "30d"): Promise<IntelligenceResultDto[]>;
  getTrendingSearches(region?: string): Promise<IntelligenceResultDto[]>;
  searchGoogleTrends(keyword: string, options?: Omit<GoogleTrendsRequest, "keywords">): Promise<IntelligenceResultDto[]>;
}

const demoSignals = [
  {
    keyword: "faceless workflow",
    topic: "AI Automation",
    hashtag: "#AITools",
    trendSignal: 96,
    contentPotential: 94,
    competitionLevel: "Medium" as const,
    platformFit: 92,
    relatedQueryGrowth: 88,
    volumeLabel: "High demo signal",
    trendDirection: "RISING" as const,
    category: "Creator Productivity",
    viralReason: "Demo insight: creator audiences respond to proof-based automation workflows.",
    opportunity: "Show the finished automation result in the first 3 seconds, then explain the steps."
  },
  {
    keyword: "creator automation stack",
    topic: "Creator Productivity",
    hashtag: "#CreatorTools",
    trendSignal: 88,
    contentPotential: 90,
    competitionLevel: "High" as const,
    platformFit: 86,
    relatedQueryGrowth: 76,
    volumeLabel: "Medium demo signal",
    trendDirection: "RISING" as const,
    category: "Education",
    viralReason: "Demo insight: before-after tool stack formats create a clear curiosity gap.",
    opportunity: "Package the topic as a 45-second education clip with numbered proof points."
  },
  {
    keyword: "AI product reveal",
    topic: "Product Visual AI",
    hashtag: "#AIReels",
    trendSignal: 82,
    contentPotential: 88,
    competitionLevel: "Medium" as const,
    platformFit: 84,
    relatedQueryGrowth: 72,
    volumeLabel: "Medium demo signal",
    trendDirection: "STABLE" as const,
    category: "Affiliate Visual",
    viralReason: "Demo insight: motion-image product reveal concepts are useful for visual testing.",
    opportunity: "Use a clean product close-up, motion hook, and concise affiliate CTA."
  },
  {
    keyword: "short podcast hooks",
    topic: "Podcast Highlights",
    hashtag: "#PodcastClips",
    trendSignal: 70,
    contentPotential: 76,
    competitionLevel: "Low" as const,
    platformFit: 72,
    relatedQueryGrowth: 42,
    volumeLabel: "Low demo signal",
    trendDirection: "FALLING" as const,
    category: "Storytelling",
    viralReason: "Demo insight: conflict-led short hooks remain useful, but the sample signal is softer.",
    opportunity: "Use one clear conflict, captions, and a question CTA in a 60-second clip."
  }
];

async function collectDemoGoogleTrends(request: GoogleTrendsRequest = {}): Promise<IntelligenceResultDto[]> {
    const collectedAt = new Date().toISOString();
    const requested = request.keywords?.map((keyword) => keyword.toLowerCase());
    return demoSignals
      .filter((signal) => !requested?.length || requested.includes(signal.keyword.toLowerCase()))
      .map((signal, index) => ({
        id: `demo_google_trends_${index + 1}`,
        keyword: signal.keyword,
        topic: signal.topic,
        platform: "GOOGLE_TRENDS",
        source: "Google Trends demo adapter",
        sourceUrl: "https://trends.google.com/trends/",
        score: calculateGoogleTrendsScore({ interestValue: signal.trendSignal, relatedQueryGrowth: signal.relatedQueryGrowth, recencyHours: 4 + index * 6, trendDirection: signal.trendDirection }).score,
        confidence: 35,
        volumeLabel: signal.volumeLabel,
        trendDirection: signal.trendDirection,
        category: signal.category,
        region: request.region ?? "ID",
        language: "id",
        collectedAt,
        rawData: {
          adapter: "demoGoogleTrendsAdapter",
          timeRange: request.timeRange ?? "7d",
          trendSignal: signal.trendSignal,
          interestValue: signal.trendSignal,
          relatedQueryGrowth: signal.relatedQueryGrowth,
          contentPotential: signal.contentPotential,
          platformFit: signal.platformFit
        },
        isDemo: true,
        notes: "Demo insight, belum terhubung ke data real.",
        hashtag: signal.hashtag,
        competitionLevel: signal.competitionLevel,
        monetizationPotential: signal.contentPotential >= 85 ? "High" as const : "Medium" as const,
        viralReason: signal.viralReason,
        opportunity: signal.opportunity,
        socialPlatform: index === 1 ? "YOUTUBE_SHORTS" as const : index === 2 ? "INSTAGRAM_REELS" as const : index === 3 ? "FACEBOOK_REELS" as const : "TIKTOK" as const
      }));
}

export const demoGoogleTrendsAdapter: GoogleTrendsAdapter = {
  getInterestOverTime: (keyword, region = "ID", timeRange = "7d") => collectDemoGoogleTrends({ keywords: [keyword], region, timeRange }),
  getRelatedQueries: (keyword, region = "ID", timeRange = "7d") => collectDemoGoogleTrends({ keywords: [keyword], region, timeRange }),
  getTrendingSearches: (region = "ID") => collectDemoGoogleTrends({ region, timeRange: "7d" }),
  searchGoogleTrends: (keyword, options = {}) => collectDemoGoogleTrends({ ...options, keywords: [keyword] })
};
