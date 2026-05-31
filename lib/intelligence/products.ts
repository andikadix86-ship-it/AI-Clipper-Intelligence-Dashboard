import { calculateTrendScore } from "@/lib/intelligence/scoring";
import type { AffiliateProductInsightDto } from "@/lib/intelligence/types";

const collectedAt = "2026-05-31T08:00:00.000Z";

export const demoAffiliateProductInsights: AffiliateProductInsightDto[] = [
  product("nuvo-soap-green", "Nuvo Family Soap Hijau", "TikTok Shop", "Personal Care", "Medium", "Rp 1.800-3.200", "Rp 15.000-24.000", 94, 92, "Product demo supports a clear color and benefit-led visual hook."),
  product("portable-mini-blender", "Portable Mini Blender", "Shopee", "Home Appliance", "Low", "Rp 7.000-14.000", "Rp 79.000-149.000", 88, 90, "Portable use case is easy to explain in a short affiliate demonstration."),
  product("sunscreen-spray", "Sunscreen Spray SPF 50", "Tokopedia", "Beauty", "Medium", "Rp 5.000-11.000", "Rp 45.000-99.000", 84, 86, "The product has a repeatable before-outdoor-use-after content angle."),
  product("magnetic-car-holder", "Magnetic Car Holder", "TikTok Shop", "Automotive", "Low", "Rp 2.500-6.000", "Rp 29.000-69.000", 78, 82, "Problem-solution demonstrations can be recorded with a simple phone setup.")
];

function product(
  id: string,
  productName: string,
  platform: AffiliateProductInsightDto["platform"],
  category: string,
  competitionLevel: AffiliateProductInsightDto["competitionLevel"],
  commissionEstimate: string,
  priceRange: string,
  trendSignal: number,
  contentPotentialScore: number,
  notes: string
): AffiliateProductInsightDto {
  return {
    id: `demo_product_${id}`,
    productName,
    platform,
    category,
    trendScore: calculateTrendScore({ trendSignal, contentPotential: contentPotentialScore, competitionLevel, recencyHours: 12, platformFit: 84 }),
    competitionLevel,
    commissionEstimate,
    priceRange,
    contentPotentialScore,
    source: `${platform} manual demo dataset`,
    confidence: 30,
    collectedAt,
    isDemo: true,
    notes: `Demo product insight. ${notes}`
  };
}
