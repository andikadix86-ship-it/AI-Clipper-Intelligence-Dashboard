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
    programName?: string;
    websiteUrl?: string;
    dashboardUrl?: string;
    affiliateLink?: string;
    commission?: string;
    commissionInfo?: string;
    price?: string;
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
    const product = body.mode === "manual"
      ? await createManualAffiliateProduct({
        programName: body.programName ?? "",
        websiteUrl: body.websiteUrl ?? "",
        dashboardUrl: body.dashboardUrl ?? "",
        affiliateLink: body.affiliateLink ?? "",
        commission: body.commission ?? body.commissionInfo ?? "",
        price: body.price ?? "",
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
