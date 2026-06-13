import { NextResponse } from "next/server";
import { createCsvAffiliateProduct, createManualAffiliateProduct, getActiveProductSource, importAffiliateProgram, listProductIntelligence, listSourceConfig, ProductIntelligenceValidationError, syncProductIntelligence, type CsvAffiliateProductInput, type ProductSort, type ProductSourceView } from "@/lib/affiliate/product-intelligence";
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
    const sourceType = sourceView(url.searchParams.get("sourceType"));
    const products = await listProductIntelligence({
      category: url.searchParams.get("category") ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
      dateRange: url.searchParams.get("dateRange") ?? undefined,
      sort: (url.searchParams.get("sort") ?? undefined) as ProductSort | undefined,
      take: number(url.searchParams.get("take")),
      sourceType
    });
    const sourceConfig = await listSourceConfig();
    const activeSourceType = await getActiveProductSource({
      category: url.searchParams.get("category") ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
      dateRange: url.searchParams.get("dateRange") ?? undefined,
      sort: (url.searchParams.get("sort") ?? undefined) as ProductSort | undefined,
      take: number(url.searchParams.get("take")),
      sourceType
    });
    const marketplaceStatus = activeSourceType === "DEMO" ? "Marketplace API not connected. Showing NOT CONNECTED sample data only." : `${activeSourceType} product data active.`;
    return NextResponse.json({ success: true, data: { products, sourceConfig, activeSourceType, marketplaceStatus, sourceView: sourceType ?? "ACTIVE" }, products, sourceConfig, activeSourceType, marketplaceStatus, sourceView: sourceType ?? "ACTIVE", meta: { source: "engine", count: products.length, activeSourceType, marketplaceStatus, sourceView: sourceType ?? "ACTIVE", sourceStatus: sourceConfig[url.searchParams.get("source") as keyof typeof sourceConfig] } });
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
      serverLogger.info("affiliate.product_intelligence.sync_api", { source: body.source, category: body.category, mode: sync.mode, configured: sync.configured, sourceType: sync.sourceType, productCount: products.length });
      return NextResponse.json({ success: true, data: { sync, products }, sync, products, meta: { message: sync.message, sourceType: sync.sourceType, mode: sync.mode, configured: sync.configured } });
    }
    if (body.csv?.trim()) {
      const parsed = parseCsvProducts(body.csv);
      const valid = parsed.rows.filter((row) => !row.errors.length);
      const products = await Promise.all(valid.map((row) => createCsvAffiliateProduct(row.data)));
      return NextResponse.json({ success: true, data: { products, invalidRows: parsed.invalidRows }, products, invalidRows: parsed.invalidRows, meta: { source: "csv_import", sourceType: "CSV_IMPORT", data_mode: "CSV IMPORT", imported: products.length, invalid: parsed.invalidRows.length } }, { status: 201 });
    }
    const product = body.mode === "manual"
      ? await createManualAffiliateProduct({
        programName: body.programName ?? "",
        platform: body.source,
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
    return NextResponse.json({ success: true, data: { product }, product, meta: { source: "engine", sourceType: product.sourceType, scan_mode: body.mode === "manual" ? "manual" : "user_url_import" } }, { status: 201 });
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

function sourceView(value: string | null): ProductSourceView | undefined {
  if (value === "ALL" || value === "DEMO" || value === "MANUAL" || value === "CSV_IMPORT" || value === "REAL_API") return value;
  return undefined;
}

function requiredUrl(value?: string) {
  if (!value?.trim()) throw new ProductIntelligenceValidationError("Affiliate program URL wajib diisi.");
  return value.trim();
}

function parseCsvProducts(csv: string) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsv(headerLine).map((item) => normalizeHeader(item));
  const rows = lines.map((line, lineIndex) => {
    const values = splitCsv(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
    const data: CsvAffiliateProductInput = {
      productName: row.productname,
      platform: row.platform,
      category: row.category,
      price: row.price,
      soldCount: row.soldcount,
      rating: row.rating,
      reviewCount: row.reviewcount,
      commissionRate: row.commissionrate,
      marginLevel: row.marginlevel,
      productUrl: row.producturl,
      contentDifficulty: row.contentdifficulty,
      trendLevel: row.trendlevel,
      competitionLevel: row.competitionlevel
    };
    const errors = validateCsvRow(data);
    return { rowNumber: lineIndex + 2, data, errors };
  });
  return { rows, invalidRows: rows.filter((row) => row.errors.length).map((row) => ({ rowNumber: row.rowNumber, productName: row.data.productName, errors: row.errors })) };
}

function normalizeHeader(value: string) {
  return value.trim().replace(/[\s_-]+/g, "").toLowerCase();
}

function validateCsvRow(row: CsvAffiliateProductInput) {
  const errors: string[] = [];
  if (!row.productName?.trim()) errors.push("productName is required");
  if (!row.platform?.trim()) errors.push("platform is required");
  else if (!affiliateSources.includes(row.platform as (typeof affiliateSources)[number])) errors.push(`platform must be one of: ${affiliateSources.join(", ")}`);
  if (!row.category?.trim()) errors.push("category is required");
  return errors;
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
