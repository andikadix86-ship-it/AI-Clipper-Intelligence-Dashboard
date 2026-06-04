export const affiliateSources = ["TikTok Shop", "Shopee", "Tokopedia", "Lazada", "Facebook", "Instagram", "Custom Affiliate"] as const;
export type AffiliateSource = typeof affiliateSources[number];
export type AffiliateCategory = string;

export const allCategoriesLabel = "All Categories";

export const sourceCategoryMap: Record<AffiliateSource, readonly string[]> = {
  "TikTok Shop": ["Beauty & Personal Care", "Women's Fashion", "Men's Fashion", "Home & Living", "Electronics", "Health", "Food & Beverage", "Baby & Kids"],
  Shopee: ["Kecantikan", "Elektronik", "Fashion", "Rumah Tangga", "Ibu & Bayi", "Makanan & Minuman"],
  Tokopedia: ["Kecantikan", "Elektronik", "Fashion", "Rumah Tangga", "Ibu & Bayi", "Makanan & Minuman", "Software"],
  Lazada: ["Beauty", "Electronics", "Fashion", "Home & Living", "Mother & Baby", "Groceries"],
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
