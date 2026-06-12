export const affiliateSources = ["TikTok Shop", "Shopee", "Tokopedia", "Lazada", "Facebook", "Instagram", "Custom Affiliate"] as const;
export type AffiliateSource = typeof affiliateSources[number];
export type AffiliateCategory = string;

export const allCategoriesLabel = "All Categories";

export const sourceCategoryMap: Record<AffiliateSource, readonly string[]> = {
  "TikTok Shop": ["Beauty & Personal Care", "Mom & Baby", "Home Living", "Kitchen Tools", "Fashion Muslim", "Health Lifestyle", "Digital Accessories", "Food & Snack"],
  Shopee: ["Beauty & Personal Care", "Mom & Baby", "Home Living", "Kitchen Tools", "Fashion Muslim", "Health Lifestyle", "Digital Accessories", "Food & Snack"],
  Tokopedia: ["Beauty & Personal Care", "Mom & Baby", "Home Living", "Kitchen Tools", "Fashion Muslim", "Health Lifestyle", "Digital Accessories", "Food & Snack"],
  Lazada: ["Beauty & Personal Care", "Mom & Baby", "Home Living", "Kitchen Tools", "Fashion Muslim", "Health Lifestyle", "Digital Accessories", "Food & Snack"],
  Facebook: ["Local Services", "Home Products", "Fashion", "Digital Product", "Community Offers", "Automotive"],
  Instagram: ["Beauty", "Fashion", "Home Decor", "Digital Product", "Food & Beverage", "Creator Tools"],
  "Custom Affiliate": ["AI Tools", "SaaS", "Hosting", "VPN", "Course", "Membership", "Software", "Automation"]
};

export const affiliateCategories = Array.from(new Set(Object.values(sourceCategoryMap).flat()));

export function getCategoriesForSource(source: string) {
  return sourceCategoryMap[asAffiliateSource(source)] ?? sourceCategoryMap["Custom Affiliate"];
}

export function getCategoryOptionsForSource(source: string) {
  return [allCategoriesLabel, ...getCategoriesForSource(source)];
}

export function asAffiliateSource(source: string): AffiliateSource {
  return affiliateSources.includes(source as AffiliateSource) ? source as AffiliateSource : "Custom Affiliate";
}

export function normalizeSourceCategory(source: string, category: string) {
  if (!category || category === allCategoriesLabel) return allCategoriesLabel;
  const categories = getCategoriesForSource(source);
  return categories.includes(category) ? category : categories[0] ?? allCategoriesLabel;
}
