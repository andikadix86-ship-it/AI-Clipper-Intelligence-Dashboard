import { NextResponse } from "next/server";
import { createManualAffiliateProduct, importAffiliateProgram, listProductIntelligence, listSourceConfig, ProductIntelligenceValidationError, syncProductIntelligence, type ProductSort } from "@/lib/affiliate/product-intelligence";
import { affiliateSources, sourceCategoryMap } from "@/lib/affiliate/product-intelligence-catalog";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("meta") === "categories") {
    const sourceConfig = await listSourceConfig();
    return NextResponse.json({ success: true, data: { sourceCategoryMap, sourceConfig }, sourceCategoryMap, sourceConfig, meta: { source: "config", future_ready: "replace config with database/API categories" } });
  }
  try {
    const products = await listProductIntelligence({
      category: url.searchParams.get("category") ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
      dateRange: url.searchParams.get("dateRange") ?? undefined,
      sort: (url.searchParams.get("sort") ?? undefined) as ProductSort | undefined,
      take: number(url.searchParams.get("take"))
    });
    const sourceConfig = await listSourceConfig();
    return NextResponse.json({ success: true, data: { products, sourceConfig }, products, sourceConfig, meta: { source: "engine", count: products.length, sourceStatus: sourceConfig[url.searchParams.get("source") as keyof typeof sourceConfig] } });
  } catch (error) {
    serverLogger.error("affiliate.product_intelligence.list_failed", error);
    return NextResponse.json({ success: false, error: { code: "DATABASE_ERROR", message: "Product Intelligence belum dapat dimuat dari Supabase." } }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: {
    affiliateProgramUrl?: string;
    mode?: "manual" | "sync";
    csv?: string;
    programName?: string;
    websiteUrl?: string;
    dashboardUrl?: string;
    affiliateLink?: string;
    commission?: string;
    commissionInfo?: string;
    price?: string;
    salesVolume?: string;
    trendScore?: string;
    opportunityScore?: string;
    productName?: string;
    category?: string;
    source?: string;
    notes?: string;
  };
  try { body = await request.json(); } catch { return validationError("Invalid JSON body."); }
  try {
    if (body.mode === "sync") {
      const sync = await syncProductIntelligence({ source: body.source && affiliateSources.includes(body.source as (typeof affiliateSources)[number]) ? body.source : undefined, category: body.category });
      const products = await listProductIntelligence({ source: body.source, category: body.category, take: 10 });
      return NextResponse.json({ success: true, data: { sync, products }, sync, products, meta: { message: sync.message } });
    }
    if (body.csv?.trim()) {
      const rows = parseCsvProducts(body.csv).map((row) => createManualAffiliateProduct(row));
      const products = await Promise.all(rows);
      return NextResponse.json({ success: true, data: { products }, products, meta: { source: "manual_csv", data_mode: "MANUAL REAL DATA" } }, { status: 201 });
    }
    const product = body.mode === "manual"
      ? await createManualAffiliateProduct({
        programName: body.programName ?? "",
        websiteUrl: body.websiteUrl ?? "",
        dashboardUrl: body.dashboardUrl ?? "",
        affiliateLink: body.affiliateLink ?? "",
        commission: body.commission ?? body.commissionInfo ?? "",
        price: body.price ?? "",
        salesVolume: body.salesVolume,
        trendScore: body.trendScore,
        opportunityScore: body.opportunityScore,
        productName: body.productName ?? "",
        category: body.category ?? "",
        notes: body.notes
      })
      : await importAffiliateProgram(requiredUrl(body.affiliateProgramUrl));
    return NextResponse.json({ success: true, data: { product }, product, meta: { source: "engine", scan_mode: body.mode === "manual" ? "manual" : product.sourceType === "CACHE" ? "fallback" : "imported" } }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductIntelligenceValidationError) return validationError(error.message);
    serverLogger.error("affiliate.product_intelligence.import_failed", error);
    return NextResponse.json({ success: false, error: { code: "IMPORT_ERROR", message: "Affiliate program belum dapat dipindai atau disimpan." } }, { status: 503 });
  }
}

function validationError(message: string) {
  return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 });
}

function number(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function requiredUrl(value?: string) {
  if (!value?.trim()) throw new ProductIntelligenceValidationError("Affiliate program URL wajib diisi.");
  return value.trim();
}

function parseCsvProducts(csv: string) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsv(headerLine).map((item) => item.trim().toLowerCase());
  return lines.map((line) => {
    const values = splitCsv(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
    return {
      programName: row.program_name || row.program || "Manual CSV Import",
      websiteUrl: row.website_url || row.website || row.product_url || row.affiliate_link,
      dashboardUrl: row.dashboard_url || row.website_url || row.website || row.affiliate_link,
      affiliateLink: row.affiliate_link || row.source_url || row.product_url || row.website_url,
      productName: row.product_name,
      category: row.category,
      commission: row.commission,
      price: row.price,
      salesVolume: row.sales_volume,
      trendScore: row.trend_score,
      opportunityScore: row.opportunity_score,
      notes: row.notes || `Manual CSV real product data from ${row.source || "CSV import"}.`
    };
  });
}

function splitCsv(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === "\"") quoted = !quoted;
    else if (char === "," && !quoted) { values.push(current); current = ""; }
    else current += char;
  }
  values.push(current);
  return values;
}
