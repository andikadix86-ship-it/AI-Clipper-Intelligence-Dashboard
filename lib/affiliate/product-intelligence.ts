import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";
import type { AffiliateProductInsightDto, ProductOpportunityScore } from "@/lib/intelligence/types";
import { affiliateCategories, affiliateSources, allCategoriesLabel, asAffiliateSource, getCategoriesForSource, sourceCategoryMap } from "@/lib/affiliate/product-intelligence-catalog";
import type { AffiliateCategory, AffiliateSource } from "@/lib/affiliate/product-intelligence-catalog";
import { calculateAffiliateProductScore } from "@/lib/affiliate/product-scoring";

export type ProductSourceType = "DEMO" | "CACHE" | "REAL" | "REAL_USER_INPUT";
export type ProductSourceMode = "DEMO" | "CACHE" | "REAL" | "REAL_USER_INPUT";
export type ProductSort = "Opportunity Score" | "Revenue / GMV" | "Sales" | "Commission" | "Trend Growth";

type ProductSeed = {
  productName: string;
  platform: AffiliateSource;
  category: AffiliateCategory;
  commissionRate: number;
  price: number;
  trendScore?: number;
  opportunityScore?: number;
  priceRange?: string;
  productUrl?: string;
  affiliateUrl?: string;
  revenue?: number;
  salesVolume?: number;
  sourceType: ProductSourceType;
  notes?: string;
  rawData?: Record<string, unknown>;
};

export type ManualAffiliateProductInput = {
  programName: string;
  websiteUrl: string;
  dashboardUrl: string;
  affiliateLink: string;
  productName: string;
  category: string;
  commission: string;
  price: string;
  salesVolume?: string;
  trendScore?: string;
  opportunityScore?: string;
  notes?: string;
};

type AdapterResult = {
  products: ProductSeed[];
  sourceType: ProductSourceType;
  mode: ProductSourceMode;
  configured: boolean;
  message?: string;
};

type ProductAdapter = {
  source: AffiliateSource;
  mode: ProductSourceMode;
  configured: boolean;
  getProducts(category?: string): Promise<AdapterResult>;
  getCategories(): string[];
};

export const sourceConfig: Record<AffiliateSource, { mode: ProductSourceMode; configured: boolean }> = {
  "TikTok Shop": { mode: "DEMO", configured: false },
  Shopee: { mode: "DEMO", configured: false },
  Tokopedia: { mode: "DEMO", configured: false },
  Lazada: { mode: "DEMO", configured: false },
  Facebook: { mode: "DEMO", configured: false },
  Instagram: { mode: "DEMO", configured: false },
  "Custom Affiliate": { mode: "REAL_USER_INPUT", configured: true }
};

export class ProductIntelligenceEngine {
  async getProducts(input: { source?: string; category?: string; dateRange?: string; sort?: ProductSort; take?: number; sync?: boolean } = {}) {
    const source = input.source ? asAffiliateSource(input.source) : undefined;
    if (input.sync && source) await this.syncSource(source, input.category);

    if (source === "Custom Affiliate") {
      const custom = await this.readCache({ ...input, source, sourceType: "REAL_USER_INPUT" });
      return custom.map((product) => this.markSourceType(product));
    }

    const cache = await this.readCache({ ...input, source });
    if (cache.length) return cache.map((product) => this.markSourceType(product));

    if (!source) return [];
    const adapter = adapterForSource(source);
    const result = await adapter.getProducts(input.category);
    if (!result.configured && !input.sync) return [];
    const saved = await Promise.all(result.products.map((product) => this.saveToCache(product)));
    return saved.map((product) => this.markSourceType(product));
  }

  async getCategories(source?: string) {
    return adapterForSource(asAffiliateSource(source ?? "TikTok Shop")).getCategories();
  }

  scoreProduct(product: Pick<ProductSeed, "productName" | "platform" | "category" | "commissionRate" | "price" | "salesVolume" | "revenue" | "trendScore" | "opportunityScore">): ProductOpportunityScore | null {
    if (missingProductFields(product).length) return null;
    const hash = createHash("sha256").update(`${product.productName}|${product.platform}|${product.category}`).digest();
    const score = calculateAffiliateProductScore({
      ...product,
      trendScore: product.trendScore ?? (product.revenue ? Math.min(100, 48 + product.revenue / 1_000_000) : 55 + hash[3] % 43),
      contentPotentialScore: 62 + hash[2] % 35,
      policySafetyScore: 62
    });
    return { ...score, opportunity: product.opportunityScore ? bounded(product.opportunityScore) : score.opportunity };
  }

  async saveToCache(seed: ProductSeed) {
    const score = this.scoreProduct(seed);
    const data = insightData(seed, score);
    const existing = await withTimeout(prisma.affiliateProductInsight.findFirst({ where: { productName: seed.productName, platform: seed.platform, source: seed.platform } }));
    const product = existing
      ? await withTimeout(prisma.affiliateProductInsight.update({ where: { id: existing.id }, data }))
      : await withTimeout(prisma.affiliateProductInsight.create({ data }));
    return toDto(product);
  }

  markSourceType(product: AffiliateProductInsightDto): AffiliateProductInsightDto {
    const sourceType = product.sourceType ?? (product.isDemo ? "DEMO" : "CACHE");
    return { ...product, sourceType, dataMode: dataMode(sourceType), missingFields: product.missingFields ?? requiredMissing(product), isEstimated: product.isEstimated ?? false };
  }

  async syncSource(source: AffiliateSource, category?: string) {
    const adapter = adapterForSource(source);
    if (source === "Custom Affiliate") return { ...sourceConfig[source], message: "Custom Affiliate memakai input user dari Supabase." };
    const result = await adapter.getProducts(category);
    await Promise.all(result.products.map((product) => this.saveToCache(product)));
    return { mode: result.mode, configured: result.configured, message: result.message ?? fallbackMessage(result.configured) };
  }

  private async readCache(input: { source?: string; category?: string; dateRange?: string; sort?: ProductSort; take?: number; sourceType?: ProductSourceType }) {
    const source = input.source ? asAffiliateSource(input.source) : undefined;
    const minDate = minDateFromRange(input.dateRange);
    const products = await withTimeout(prisma.affiliateProductInsight.findMany({
      where: {
        category: input.category && input.category !== "All" && input.category !== allCategoriesLabel ? input.category : undefined,
        platform: source,
        sourceType: input.sourceType,
        collectedAt: minDate ? { gte: minDate } : undefined
      },
      take: Math.min(Math.max(input.take ?? 70, 1), 140)
    }));
    return products.map(toDto).sort((a, b) => sortValue(b, input.sort) - sortValue(a, input.sort));
  }
}

export const productIntelligenceEngine = new ProductIntelligenceEngine();

export async function listProductIntelligence(input: { category?: string; source?: string; dateRange?: string; sort?: ProductSort; take?: number; sync?: boolean } = {}) {
  return productIntelligenceEngine.getProducts(input);
}

export async function listSourceConfig() {
  return sourceConfig;
}

export async function syncProductIntelligence(input: { source?: string; category?: string } = {}) {
  return productIntelligenceEngine.syncSource(asAffiliateSource(input.source ?? "TikTok Shop"), input.category);
}

export async function importAffiliateProgram(urlValue: string) {
  const url = validateAffiliateUrl(urlValue);
  const page = await readAffiliatePage(url);
  const seed = productFromUrl(url, page);
  const product = await productIntelligenceEngine.saveToCache(seed);
  await writeAuditLog({ action: "AFFILIATE_PROGRAM_IMPORTED", entityType: "AffiliateProductInsight", entityId: product.id, message: `Affiliate program imported: ${product.productName}.`, metadata: { host: url.hostname, mode: page.mode, category: seed.category, opportunityScore: product.opportunityScore } });
  serverLogger.info("affiliate.product_intelligence.imported", { host: url.hostname, mode: page.mode, category: seed.category, opportunityScore: product.opportunityScore });
  return product;
}

export async function createManualAffiliateProduct(input: ManualAffiliateProductInput) {
  if (!input.programName.trim()) throw new ProductIntelligenceValidationError("Program Name wajib diisi.");
  if (!input.productName.trim()) throw new ProductIntelligenceValidationError("Product / Service Name wajib diisi.");
  const website = validateAffiliateUrl(input.websiteUrl);
  const dashboard = validateAffiliateUrl(input.dashboardUrl);
  const affiliate = validateAffiliateUrl(input.affiliateLink);
  const commissionRate = commissionNumber(input.commission);
  const price = priceNumber(input.price);
  const program = await withTimeout(prisma.affiliateProgram.create({
    data: {
      name: input.programName.trim(),
      website: website.toString(),
      dashboardUrl: dashboard.toString(),
      affiliateLink: affiliate.toString(),
      commissionInfo: input.commission.trim(),
      products: [{ productName: input.productName.trim(), category: input.category, price, affiliateLink: affiliate.toString() }] as Prisma.InputJsonValue,
      notes: input.notes?.trim() ?? ""
    }
  }));
  const product = await productIntelligenceEngine.saveToCache({
    productName: input.productName.trim(),
    platform: "Custom Affiliate",
    category: asCategory(input.category),
    commissionRate,
        price,
        salesVolume: parseIntNumber(input.salesVolume),
        trendScore: parseIntNumber(input.trendScore),
        opportunityScore: parseIntNumber(input.opportunityScore),
    priceRange: rupiahRange(price),
    productUrl: website.toString(),
    affiliateUrl: affiliate.toString(),
    sourceType: "REAL_USER_INPUT",
    notes: input.notes?.trim() || `Manual custom affiliate product from ${input.programName.trim()}.`,
    rawData: { programId: program.id, dashboardUrl: dashboard.toString(), programName: input.programName.trim() }
  });
  await writeAuditLog({ action: "CUSTOM_AFFILIATE_PRODUCT_CREATED", entityType: "AffiliateProductInsight", entityId: product.id, message: `Custom affiliate product created: ${product.productName}.`, metadata: { programId: program.id, category: product.category, opportunityScore: product.opportunityScore } });
  return product;
}

function adapterForSource(source: AffiliateSource): ProductAdapter {
  return productIntelligenceAdapters[source];
}

export const tiktokShopAdapter = demoBackedAdapter("TikTok Shop");
export const shopeeAdapter = demoBackedAdapter("Shopee");
export const tokopediaAdapter = demoBackedAdapter("Tokopedia");
export const lazadaAdapter = demoBackedAdapter("Lazada");
export const facebookAdapter = demoBackedAdapter("Facebook");
export const instagramAdapter = demoBackedAdapter("Instagram");
export const demoAdapter = demoBackedAdapter("TikTok Shop");

function demoBackedAdapter(source: AffiliateSource): ProductAdapter {
  return {
    source,
    ...sourceConfig[source],
    getCategories: () => [...getCategoriesForSource(source)],
    async getProducts(category?: string) {
      const categories = category && category !== allCategoriesLabel ? [category] : getCategoriesForSource(source);
      return {
        products: categories.flatMap((item, categoryIndex) => categoryProducts(item).map((productName, index) => demoSeed(source, item, productName, categoryIndex, index))),
        sourceType: "DEMO",
        mode: "DEMO",
        configured: false,
        message: fallbackMessage(false)
      };
    }
  };
}

const customAffiliateAdapter: ProductAdapter = {
  source: "Custom Affiliate",
  ...sourceConfig["Custom Affiliate"],
  getCategories: () => [...getCategoriesForSource("Custom Affiliate")],
  async getProducts() {
    return { products: [], sourceType: "REAL_USER_INPUT", mode: "REAL_USER_INPUT", configured: true };
  }
};

export const productIntelligenceAdapters: Record<AffiliateSource, ProductAdapter> = {
  "TikTok Shop": tiktokShopAdapter,
  Shopee: shopeeAdapter,
  Tokopedia: tokopediaAdapter,
  Lazada: lazadaAdapter,
  Facebook: facebookAdapter,
  Instagram: instagramAdapter,
  "Custom Affiliate": customAffiliateAdapter
};

function demoSeed(platform: AffiliateSource, category: string, productName: string, categoryIndex: number, index: number): ProductSeed {
  const price = platform === "Custom Affiliate" ? 399_000 + index * 90_000 : 49_000 + ((categoryIndex + 1) * 17_000) + index * 24_000;
  const commissionRate = platform === "Custom Affiliate" ? 20 + (index % 8) : 7 + ((categoryIndex * 3 + index * 2) % 14);
  const salesVolume = 180 + categoryIndex * 76 + index * 31;
  const revenue = price * salesVolume;
  return {
    productName,
    platform,
    category,
    commissionRate,
    price,
    priceRange: platform === "Custom Affiliate" ? "Rp99.000 - Rp1.999.000" : "Rp49.000 - Rp799.000",
    revenue,
    salesVolume,
    sourceType: "DEMO",
    notes: `DEMO starter product intelligence for ${platform} / ${category}. Real API belum dikonfigurasi; validasi data sebelum publishing.`
  };
}

function categoryProducts(category: string) {
  const normalized = category.toLowerCase();
  if (/beauty|kecantikan|personal care/.test(normalized)) return ["Serum Barrier Repair", "Sunscreen Daily Glow", "Lip Tint Long Wear", "Hair Mist Fresh", "Body Lotion Bright", "Cleansing Balm Gentle", "Facial Wash Low PH", "Sheet Mask Hydration", "Eyebrow Pencil Natural", "Perfume Pocket Edition"];
  if (/fashion|women|men|creator/.test(normalized)) return ["Inner Cooling Essential", "Sling Bag Daily", "Sneakers Casual Light", "Kemeja Linen Basic", "Travel Outfit Kit", "Cargo Pants Relaxed", "Cardigan Knit Soft", "Sandal Anti Slip", "Wallet Card Holder", "Creator Styling Pack"];
  if (/home|rumah|living|decor/.test(normalized)) return ["Mini Vacuum Cordless", "Rak Dapur Modular", "Lampu Sensor Motion", "Storage Box Foldable", "Portable Blender Pro", "Smart Plug Energy Saver", "Mop Spray Compact", "Diffuser Aroma Quiet", "Organizer Kabel Meja", "CCTV Outdoor 4MP"];
  if (/electronic|elektronik|gadget|software|ai|saas|hosting|vpn|automation/.test(normalized)) return ["Wireless Mic Clip", "Power Bank Fast Charge", "Tripod Creator Mini", "AI Caption Studio", "SaaS Landing Builder", "Hosting Starter Plan", "VPN Privacy Plan", "Automation Workflow Pack", "Prompt Pack Content Creator", "Affiliate Campaign Tracker"];
  if (/health/.test(normalized)) return ["Tumbler Reminder Hydration", "Neck Pillow Ergonomic", "Resistance Band Set", "Digital Scale Compact", "Meal Prep Container", "Lumbar Support Cushion", "Yoga Mat Non Slip", "Foam Roller Compact", "Sleep Mask Soft", "Walking Pad Compact"];
  if (/baby|kids|bayi|ibu/.test(normalized)) return ["Busy Book Edukasi", "Botol Minum Anak", "Lunch Box Sekat", "Flash Card Bahasa", "Puzzle Kayu Edukasi", "Drawing Tablet Kids", "Tas Sekolah Ringan", "Night Lamp Kids", "Building Blocks Set", "Play Mat Foldable"];
  if (/food|makanan|minuman|grocer/.test(normalized)) return ["Snack Box Healthy", "Coffee Drip Pack", "Meal Sauce Bundle", "Herbal Drink Set", "Protein Snack Bar", "Frozen Food Starter", "Tea Sampler Pack", "Spice Kit Family", "Granola Breakfast Jar", "Beverage Mix Sachet"];
  if (/course|membership|digital|community|service/.test(normalized)) return ["Mini Course Video Editing", "Canva Social Media Kit", "Notion Content Planner", "Template Finance Planner", "Spreadsheet Profit Calculator", "Ebook Personal Branding", "Digital Invitation Template", "Membership Creator Club", "Automation Playbook", "SaaS Onboarding Kit"];
  return ["Best Seller Bundle", "Daily Use Product", "Creator Demo Kit", "Value Pack Starter", "Premium Trial Offer", "Compact Utility Set", "Problem Solver Pack", "Seasonal Promo Product", "Starter Bundle", "Pro Upgrade Offer"];
}

function insightData(seed: ProductSeed, score: ProductOpportunityScore | null) {
  const missingFields = missingProductFields(seed);
  return {
    productName: seed.productName,
    platform: seed.platform,
    category: seed.category,
    sourceType: seed.sourceType,
    productUrl: seed.productUrl,
    affiliateUrl: seed.affiliateUrl,
    price: seed.price,
    commissionRate: seed.commissionRate,
    revenue: seed.revenue,
    salesVolume: seed.salesVolume,
    demandScore: score?.demand,
    trendScore: score?.trend ?? seed.trendScore ?? 0,
    competitionLevel: score ? score.competition >= 70 ? "High" : score.competition >= 45 ? "Medium" : "Low" : "Medium",
    competitionScore: score?.competition,
    commissionEstimate: `${seed.commissionRate}%`,
    commissionScore: score?.commission,
    priceRange: seed.priceRange ?? rupiahRange(seed.price),
    contentPotentialScore: score?.contentPotential ?? 0,
    opportunityScore: score?.opportunity,
    isEstimated: false,
    lastSyncedAt: new Date(),
    source: seed.platform,
    sourceUrl: seed.affiliateUrl ?? seed.productUrl,
    confidence: seed.sourceType === "REAL_USER_INPUT" ? 82 : seed.sourceType === "REAL" ? 88 : 35,
    collectedAt: new Date(),
    isDemo: seed.sourceType === "DEMO",
    notes: seed.notes ?? "Imported affiliate program candidate. Review offer details before campaign activation.",
    rawData: { scoreBreakdown: score, sourceType: seed.sourceType, dataMode: dataMode(seed.sourceType), missingFields, isEstimated: false, ...seed.rawData } as Prisma.InputJsonValue
  };
}

function toDto(product: {
  id: string; productName: string; platform: string; category: string; sourceType?: string; productUrl?: string | null; affiliateUrl?: string | null; price?: number | null; commissionRate?: number | null; revenue?: number | null; salesVolume?: number | null; demandScore?: number | null; trendScore: number; competitionLevel: string; competitionScore?: number | null; commissionEstimate: string; commissionScore?: number | null; priceRange: string; contentPotentialScore: number; opportunityScore?: number | null; isEstimated?: boolean | null; lastSyncedAt?: Date | null; source: string; sourceUrl: string | null; confidence: number; collectedAt: Date; isDemo: boolean; notes: string; rawData: unknown;
}): AffiliateProductInsightDto {
  const rawData = product.rawData as { scoreBreakdown?: ProductOpportunityScore | null; sourceType?: ProductSourceType; isEstimated?: boolean; missingFields?: string[]; dataMode?: AffiliateProductInsightDto["dataMode"] } | null;
  const score = rawData?.scoreBreakdown ?? {
    demand: product.demandScore ?? product.trendScore,
    competition: product.competitionScore ?? competitionScore(product.competitionLevel),
    commission: product.commissionScore ?? commissionNumber(product.commissionEstimate),
    contentPotential: product.contentPotentialScore,
    trend: product.trendScore,
    opportunity: product.opportunityScore ?? Math.round((product.trendScore + product.contentPotentialScore) / 2)
  };
  const sourceType = asSourceType(product.sourceType ?? rawData?.sourceType ?? (product.isDemo ? "DEMO" : "CACHE"));
  const missingFields = rawData?.missingFields ?? requiredMissing({ price: product.price ?? undefined, commissionRate: product.commissionRate ?? undefined, salesVolume: product.salesVolume ?? undefined, trendScore: product.trendScore, opportunityScore: product.opportunityScore ?? undefined });
  return {
    ...product,
    platform: asSource(product.platform),
    competitionLevel: asCompetition(product.competitionLevel),
    sourceUrl: product.sourceUrl ?? undefined,
    productUrl: product.productUrl ?? undefined,
    affiliateUrl: product.affiliateUrl ?? undefined,
    price: product.price ?? undefined,
    commissionRate: product.commissionRate ?? undefined,
    revenue: product.revenue ?? undefined,
    salesVolume: product.salesVolume ?? undefined,
    collectedAt: product.collectedAt.toISOString(),
    lastSyncedAt: product.lastSyncedAt?.toISOString(),
    sourceType,
    dataMode: rawData?.dataMode ?? dataMode(sourceType),
    missingFields,
    isEstimated: product.isEstimated ?? rawData?.isEstimated ?? false,
    opportunityScore: missingFields.length ? undefined : score.opportunity,
    scoreBreakdown: missingFields.length ? undefined : score
  };
}

async function readAffiliatePage(url: URL) {
  try {
    const response = await fetchAffiliatePage(url);
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const html = (await response.text()).slice(0, 250_000);
    return { mode: "html" as const, title: match(html, /<title[^>]*>([^<]+)<\/title>/i) || humanize(url), description: match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) };
  } catch (error) {
    serverLogger.warn("affiliate.product_intelligence.scan_fallback", { host: url.hostname }, error);
    return { mode: "url_fallback" as const, title: humanize(url), description: "" };
  }
}

async function fetchAffiliatePage(url: URL, redirectCount = 0): Promise<Response> {
  const response = await fetch(url, { headers: { "User-Agent": "FVN-AI-Studio-Affiliate-Scanner/1.0" }, signal: AbortSignal.timeout(4500), redirect: "manual" });
  if (response.status < 300 || response.status >= 400) return response;
  if (redirectCount >= 3) throw new Error("TOO_MANY_REDIRECTS");
  const location = response.headers.get("location");
  if (!location) throw new Error("REDIRECT_LOCATION_MISSING");
  return fetchAffiliatePage(validateAffiliateUrl(new URL(location, url).toString()), redirectCount + 1);
}

function productFromUrl(url: URL, page: { title: string; description: string; mode: "html" | "url_fallback" }): ProductSeed {
  const title = page.title.replace(/\s+/g, " ").trim().slice(0, 96) || humanize(url);
  return { productName: title, platform: sourceFromHost(url.hostname), category: categoryFromText(`${title} ${page.description} ${url.pathname}`), commissionRate: 10, price: 0, priceRange: "Validate from affiliate program", productUrl: url.toString(), affiliateUrl: url.toString(), sourceType: page.mode === "html" ? "REAL" : "CACHE", notes: `Imported from affiliate program URL using ${page.mode === "html" ? "HTML metadata scan" : "URL fallback extraction"}. Validate commission and product details before publishing.` };
}

function validateAffiliateUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new ProductIntelligenceValidationError("Affiliate program URL tidak valid."); }
  if (url.protocol !== "https:") throw new ProductIntelligenceValidationError("Affiliate program URL wajib menggunakan HTTPS.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || /^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) throw new ProductIntelligenceValidationError("Private network URL tidak diizinkan.");
  return url;
}

export class ProductIntelligenceValidationError extends Error {
  code = "VALIDATION_ERROR" as const;
}

function minDateFromRange(dateRange?: string) {
  const match = dateRange?.match(/(\d+)/);
  const days = match ? Number(match[1]) : 0;
  return days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;
}
function sortValue(product: AffiliateProductInsightDto, sort?: ProductSort) { const score = product.scoreBreakdown; if (sort === "Revenue / GMV") return product.revenue ?? 0; if (sort === "Sales") return product.salesVolume ?? 0; if (sort === "Commission") return score?.commission ?? 0; if (sort === "Trend Growth") return score?.trend ?? product.trendScore; return product.opportunityScore ?? score?.opportunity ?? 0; }
function sourceFromHost(host: string): AffiliateSource { const value = host.toLowerCase(); if (value.includes("tiktok")) return "TikTok Shop"; if (value.includes("shopee")) return "Shopee"; if (value.includes("tokopedia")) return "Tokopedia"; if (value.includes("lazada")) return "Lazada"; if (value.includes("facebook")) return "Facebook"; if (value.includes("instagram")) return "Instagram"; return "Custom Affiliate"; }
function categoryFromText(text: string): AffiliateCategory { const value = text.toLowerCase(); if (/beauty|serum|skin|lip|hair|cosmetic/.test(value)) return "Beauty & Personal Care"; if (/gadget|phone|camera|usb|mic|earbud|tech|electronic/.test(value)) return "Electronics"; if (/fashion|shirt|bag|hijab|shoe|sandal/.test(value)) return "Women's Fashion"; if (/health|fit|yoga|sleep|meal|hydration/.test(value)) return "Health"; if (/kids|anak|baby|toy|school/.test(value)) return "Baby & Kids"; if (/digital|course|ebook|template|notion|canva|prompt|ai|saas|software/.test(value)) return "AI Tools"; return "Home & Living"; }
function humanize(url: URL) { return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? url.hostname).replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
function match(value: string, pattern: RegExp) { return value.match(pattern)?.[1]?.replace(/&amp;/g, "&").trim() ?? ""; }
function bounded(value: number) { return Math.min(100, Math.max(0, Math.round(value))); }
function competitionScore(value: string) { return value === "High" ? 82 : value === "Medium" ? 58 : 34; }
function asCompetition(value: string): AffiliateProductInsightDto["competitionLevel"] { return value === "High" || value === "Low" ? value : "Medium"; }
function asSource(value: string): AffiliateSource { return asAffiliateSource(value); }
function asCategory(value: string): AffiliateCategory { return affiliateCategories.includes(value) ? value : sourceCategoryMap["Custom Affiliate"][0]; }
function asSourceType(value: string): ProductSourceType { return value === "REAL" || value === "REAL_USER_INPUT" || value === "CACHE" ? value : "DEMO"; }
function commissionNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 10;
  const parsed = Number(String(value ?? "").match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(",", "."));
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 10;
}
function parseIntNumber(value?: string) {
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
}
function priceNumber(value: string) {
  const parsed = Number(value.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
function dataMode(sourceType: ProductSourceType): AffiliateProductInsightDto["dataMode"] {
  if (sourceType === "REAL_USER_INPUT") return "MANUAL REAL DATA";
  if (sourceType === "REAL" || sourceType === "CACHE") return "REAL DATA";
  return "DEMO DATA";
}
function missingProductFields(product: Pick<ProductSeed, "price" | "commissionRate" | "salesVolume" | "trendScore" | "opportunityScore">) {
  return requiredMissing(product);
}
function requiredMissing(product: { price?: number | null; commissionRate?: number | null; salesVolume?: number | null; trendScore?: number | null; opportunityScore?: number | null }) {
  const missing: string[] = [];
  if (!product.price || product.price <= 0) missing.push("price");
  if (!product.commissionRate || product.commissionRate <= 0) missing.push("commission");
  if (!Number.isFinite(product.salesVolume ?? NaN) || (product.salesVolume ?? 0) <= 0) missing.push("sales_volume");
  if (!Number.isFinite(product.trendScore ?? NaN) || (product.trendScore ?? 0) <= 0) missing.push("trend_score");
  if (!Number.isFinite(product.opportunityScore ?? NaN) || (product.opportunityScore ?? 0) <= 0) missing.push("opportunity_score");
  return missing;
}
function rupiahRange(value: number) { return value > 0 ? rupiah(value) : "Validate from custom program"; }
function rupiah(value: number) { return `Rp${Math.round(value).toLocaleString("id-ID")}`; }
function fallbackMessage(configured: boolean) { return configured ? "Product data synced." : "Demo data active. Configure API or import real product data to test real workflow."; }
