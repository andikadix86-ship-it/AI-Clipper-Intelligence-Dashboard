import type { AffiliateProductInsightDto, ProductCampaignPlan, ProductContentFormat, ProductContentStrategy, ProductOpportunityScore } from "../intelligence/types";
import { generateProductContentStrategy, type ProductContentStrategyInput } from "./product-content-strategy";
import { calculateAffiliateProductScore, opportunityLabel } from "./product-scoring";

export type ProductCampaignPlannerInput = ProductContentStrategyInput & Partial<Pick<AffiliateProductInsightDto, "notes" | "productUrl" | "sourceUrl">>;

const campaignStages = [
  "Awareness",
  "Problem Education",
  "Product Introduction",
  "Review / Demo",
  "Comparison / Objection Handling",
  "Social Proof / Benefit Reminder",
  "Strong CTA / Conversion Push"
] as const;

export function generateProductCampaignPlan(
  product: ProductCampaignPlannerInput,
  score: ProductOpportunityScore = calculateAffiliateProductScore(product),
  strategy: ProductContentStrategy = generateProductContentStrategy(product, score)
): ProductCampaignPlan {
  const duration = campaignDuration(score.finalOpportunityScore);
  const productName = clean(product.productName) || "produk ini";
  const category = clean(product.category) || "produk affiliate";
  const theme = campaignTheme(category, strategy.bestContentFormat);
  const cta = campaignCta(product.platform, productName);
  const dailyPlan = campaignStages.slice(0, duration).map((stage, index) => {
    const day = index + 1;
    const contentFormat = contentFormatForStage(stage, category, strategy);
    const hook = hookForStage(stage, productName, category, strategy);
    const angle = angleForStage(stage, productName, category, contentFormat, product.competitionLevel === "High");
    const shortScript = {
      openingHook: hook,
      problem: problemForStage(stage, category, contentFormat),
      productSolution: `${productName} dipakai sebagai solusi utama untuk membuktikan angle ${contentFormat}.`,
      proofOrBenefit: benefitForStage(stage, product, score),
      CTA: cta
    };
    return {
      day,
      stage,
      contentFormat,
      hook,
      angle,
      shortScript,
      CTA: cta,
      caption: captionForDay(day, stage, productName, category, contentFormat, score.finalOpportunityScore),
      hashtags: hashtagsForDay(strategy, stage, category),
      platformFocus: platformFocus(product.platform, stage)
    };
  });

  return {
    campaignDurationDays: duration,
    campaignGoal: campaignGoal(score.finalOpportunityScore, product.competitionLevel),
    campaignTheme: theme,
    dailyPlan,
    recommendedPostingFrequency: postingFrequency(score.finalOpportunityScore),
    successMetrics: successMetrics(score.finalOpportunityScore, product.platform),
    riskNotes: riskNotes(score.finalOpportunityScore, product.sourceType, product.competitionLevel)
  };
}

function campaignDuration(score: number) {
  const label = opportunityLabel(score);
  if (label === "HIGH OPPORTUNITY") return 7;
  if (label === "MEDIUM OPPORTUNITY") return 7;
  if (label === "LOW OPPORTUNITY") return 5;
  return 3;
}

function campaignGoal(score: number, competitionLevel?: AffiliateProductInsightDto["competitionLevel"]) {
  const label = opportunityLabel(score);
  if (label === "HIGH OPPORTUNITY") return "Scale 7 hari untuk validasi hook, klik produk, dan intent checkout.";
  if (label === "MEDIUM OPPORTUNITY") return "Testing campaign 5-7 hari untuk menemukan format konten dengan save, comment, dan klik terbaik.";
  if (label === "LOW OPPORTUNITY") return "Light test 3-5 hari untuk validasi demand sebelum menambah volume posting.";
  const competitionNote = competitionLevel === "High" ? " Kompetisi tinggi, jadi jangan scale sebelum ada sinyal organik jelas." : "";
  return `Monitor produk dan test 1-3 konten ringan saja.${competitionNote}`;
}

function postingFrequency(score: number) {
  const label = opportunityLabel(score);
  if (label === "HIGH OPPORTUNITY") return "1-2x per hari selama 7 hari.";
  if (label === "MEDIUM OPPORTUNITY") return "1x per hari selama 5-7 hari testing.";
  if (label === "LOW OPPORTUNITY") return "3-5 konten total, fokus validasi hook sebelum scale.";
  return "1-3 konten saja, monitor komentar dan klik; jangan scale dulu.";
}

function campaignTheme(category: string, format: ProductContentFormat) {
  const value = normalized(category);
  if (isFashionMuslim(value)) return "Islamic soft selling: modest lifestyle, trust, comfort, dan pemakaian harian.";
  if (isBeauty(value)) return "Beauty transformation: before-after, routine, review natural, dan bukti visual realistis.";
  if (isMomBaby(value)) return "Mom solution: solusi ibu, aman, praktis, hemat waktu, dan mudah dipakai keluarga.";
  if (isHomeLiving(value)) return "Home improvement: problem rumah, before-after, improvement, dan demo penggunaan.";
  if (isDigitalEducation(value)) return "Educational soft selling: edukasi, skill, manfaat, dan step-by-step pemakaian.";
  if (isFoodFmcg(value)) return "Daily taste review: rasa, daily use, family moment, dan review natural.";
  return `${format}: validasi problem, manfaat, dan alasan membeli dengan konten pendek bertahap.`;
}

function contentFormatForStage(stage: string, category: string, strategy: ProductContentStrategy): ProductContentFormat {
  const value = normalized(category);
  if (isFashionMuslim(value)) return "Islamic soft selling";
  if (isBeauty(value) && (stage === "Review / Demo" || stage === "Social Proof / Benefit Reminder")) return "Beauty transformation";
  if (isBeauty(value)) return stage === "Comparison / Objection Handling" ? "Comparison video" : "Before-after";
  if (isMomBaby(value)) return "Mom solution";
  if (isHomeLiving(value)) return "Home improvement";
  if (isDigitalEducation(value)) return "Educational soft selling";
  if (isFoodFmcg(value)) return stage === "Comparison / Objection Handling" ? "Comparison video" : "Review natural";
  if (stage === "Problem Education") return "Problem solution demo";
  if (stage === "Comparison / Objection Handling") return "Comparison video";
  if (stage === "Social Proof / Benefit Reminder") return "Review natural";
  if (stage === "Strong CTA / Conversion Push") return strategy.bestContentFormat === "Story selling" ? "UGC style" : strategy.bestContentFormat;
  return strategy.bestContentFormat;
}

function hookForStage(stage: string, productName: string, category: string, strategy: ProductContentStrategy) {
  if (stage === "Awareness") return strategy.hookIdeas[0];
  if (stage === "Problem Education") return `Masalah yang sering kejadian di ${category}: ini cara ngelihat solusinya.`;
  if (stage === "Product Introduction") return `Aku coba ${productName} supaya kamu bisa lihat fungsi utamanya dulu.`;
  if (stage === "Review / Demo") return `Ini demo singkat ${productName}, bagian yang paling kepakai ada di sini.`;
  if (stage === "Comparison / Objection Handling") return `Sebelum checkout, bandingin dulu ${productName} dari tiga sisi ini.`;
  if (stage === "Social Proof / Benefit Reminder") return `Ini manfaat ${productName} yang paling terasa setelah dipakai.`;
  return `Kalau butuh ${category}, cek ${productName} sebelum promo selesai.`;
}

function angleForStage(stage: string, productName: string, category: string, format: ProductContentFormat, highCompetition: boolean) {
  const categoryNote = categorySpecificAngle(category, productName);
  if (stage === "Comparison / Objection Handling" || highCompetition) return `Comparison angle: jawab keberatan pembeli, bandingkan value ${productName}, lalu tutup dengan alasan unik. ${categoryNote}`;
  if (stage === "Awareness") return `Bangun awareness dengan situasi harian yang dekat dengan target audience. ${categoryNote}`;
  if (stage === "Problem Education") return `Edukasi problem utama dulu, baru arahkan ke solusi. ${categoryNote}`;
  if (stage === "Product Introduction") return `Kenalkan fitur dan konteks pakai ${productName} tanpa hard selling. ${categoryNote}`;
  if (stage === "Review / Demo") return `Tampilkan demo nyata format ${format} dengan bukti visual. ${categoryNote}`;
  if (stage === "Social Proof / Benefit Reminder") return `Ulangi benefit paling mudah dipercaya, gunakan review/rating jika tersedia. ${categoryNote}`;
  return `Dorong conversion dengan CTA jelas dan recap manfaat utama. ${categoryNote}`;
}

function categorySpecificAngle(category: string, productName: string) {
  const value = normalized(category);
  if (isFashionMuslim(value)) return `Fokus Islamic soft selling, modest lifestyle, trust, dan comfort dari ${productName}.`;
  if (isBeauty(value)) return `Fokus before-after, routine, transformation, dan review natural.`;
  if (isMomBaby(value)) return `Fokus solusi ibu, aman, praktis, dan hemat waktu.`;
  if (isHomeLiving(value)) return `Fokus problem rumah, before-after, improvement, dan demo.`;
  if (isDigitalEducation(value)) return `Fokus edukasi, skill, manfaat, dan step-by-step.`;
  if (isFoodFmcg(value)) return `Fokus taste, daily use, family moment, dan review natural.`;
  return "";
}

function problemForStage(stage: string, category: string, format: ProductContentFormat) {
  if (stage === "Awareness") return `Audience belum sadar bahwa ada problem praktis di ${category} yang bisa diselesaikan.`;
  if (stage === "Problem Education") return `Audience perlu memahami problem sebelum melihat produk sebagai solusi.`;
  if (stage === "Comparison / Objection Handling") return `Audience ragu karena banyak pilihan, klaim mirip, atau belum yakin value produk.`;
  if (stage === "Strong CTA / Conversion Push") return `Audience sudah tertarik tapi perlu alasan terakhir untuk cek produk sekarang.`;
  return `Konten perlu membuktikan manfaat ${format} secara singkat dan realistis.`;
}

function benefitForStage(stage: string, product: ProductCampaignPlannerInput, score: ProductOpportunityScore) {
  const sales = product.salesVolume && product.salesVolume > 0 ? `${Math.round(product.salesVolume).toLocaleString("id-ID")} sales` : "sinyal demand awal";
  const commission = product.commissionRate && product.commissionRate > 0 ? `${product.commissionRate}% komisi` : "komisi perlu divalidasi";
  if (stage === "Social Proof / Benefit Reminder") return `Gunakan review, rating, komentar, atau ${sales} sebagai bukti. Final score ${score.finalOpportunityScore}/100.`;
  if (stage === "Comparison / Objection Handling") return `Bandingkan harga, fungsi, trust, dan ${commission} tanpa klaim berlebihan.`;
  return `Perlihatkan manfaat visual, cara pakai, ${sales}, dan alasan produk ini layak dites.`;
}

function captionForDay(day: number, stage: string, productName: string, category: string, format: ProductContentFormat, score: number) {
  const scaleNote = opportunityLabel(score) === "MONITOR ONLY" ? "Test kecil dulu, jangan scale." : "Simpan dulu dan cek produk saat promo aktif.";
  return `Day ${day} - ${stage}: ${productName} untuk ${category}. Format: ${format}. ${scaleNote}`;
}

function hashtagsForDay(strategy: ProductContentStrategy, stage: string, category: string) {
  const base = strategy.hashtagSet.length ? strategy.hashtagSet : ["#affiliateindonesia", `#${slug(category)}`, "#reviewproduk"];
  return [...new Set([...base, `#${slug(stage)}`])].slice(0, 7);
}

function platformFocus(platform?: AffiliateProductInsightDto["platform"], stage?: string) {
  const value = normalized(platform);
  if (value.includes("tiktok")) return stage === "Strong CTA / Conversion Push" ? "TikTok Shop product anchor + short video." : "TikTok short video dengan product anchor.";
  if (value.includes("shopee")) return "Shopee video/feed plus link produk untuk promo dan voucher.";
  if (value.includes("instagram")) return "Instagram Reels, Story reminder, dan comment prompt.";
  if (value.includes("youtube")) return "YouTube Shorts dengan CTA watch next dan comment.";
  if (value.includes("facebook")) return "Facebook Reels dengan share/comment sebagai diskusi.";
  return "TikTok, Instagram Reels, dan marketplace link sebagai test awal.";
}

function campaignCta(platform?: AffiliateProductInsightDto["platform"], productName = "produk ini") {
  const value = normalized(platform);
  if (value.includes("tiktok")) return `Follow untuk update berikutnya, save videonya, lalu cek keranjang kuning untuk promo ${productName}.`;
  if (value.includes("shopee")) return `Cek link produk ${productName}, simpan dulu, dan beli saat promo atau voucher aktif.`;
  if (value.includes("instagram")) return `Save, share ke teman yang butuh, follow untuk review berikutnya, dan comment kalau mau comparison.`;
  if (value.includes("youtube")) return `Like, subscribe, comment produk yang mau dibandingkan, dan watch next untuk review lanjutannya.`;
  if (value.includes("facebook")) return `Follow, share ke teman yang butuh, dan comment kalau ingin detail pemakaian ${productName}.`;
  return `Save konten ini, follow untuk rekomendasi berikutnya, dan cek link produk sebelum checkout.`;
}

function successMetrics(score: number, platform?: AffiliateProductInsightDto["platform"]) {
  const base = ["Watch time / retention", "Save rate", "Comment quality", "Product click-through"];
  const value = normalized(platform);
  if (value.includes("tiktok")) base.push("Keranjang kuning click rate");
  if (opportunityLabel(score) === "HIGH OPPORTUNITY") base.push("Checkout intent / add-to-cart signal");
  return base;
}

function riskNotes(score: number, sourceType?: AffiliateProductInsightDto["sourceType"], competitionLevel?: AffiliateProductInsightDto["competitionLevel"]) {
  const notes = ["Validasi stok, komisi, harga promo, review, dan klaim produk sebelum posting."];
  if (sourceType === "DEMO") notes.push("Data DEMO tidak boleh dianggap valid untuk keputusan affiliate.");
  if (competitionLevel === "High") notes.push("Kompetisi tinggi; gunakan angle unik dan jangan scale sebelum ada sinyal organik kuat.");
  if (opportunityLabel(score) === "MONITOR ONLY") notes.push("Monitor only: jangan scale, cukup test 1-3 konten ringan.");
  return notes;
}

function isFashionMuslim(value: string) {
  return /fashion muslim|muslim|hijab|modest/.test(value);
}

function isBeauty(value: string) {
  return /beauty|personal care|skincare|skin|serum|sunscreen|lip|hair|body lotion|kecantikan/.test(value);
}

function isMomBaby(value: string) {
  return /mom|baby|kids|ibu|anak|bayi/.test(value);
}

function isHomeLiving(value: string) {
  return /home|living|kitchen|rumah|dapur|decor|storage/.test(value);
}

function isDigitalEducation(value: string) {
  return /digital|education|educational|edukasi|course|ai tools|software|saas|template|ebook|membership|hosting|automation|skill/.test(value);
}

function isFoodFmcg(value: string) {
  return /food|snack|fmcg|makanan|minuman|coffee|tea|taste|grocery|grocer/.test(value);
}

function normalized(value?: unknown) {
  return String(value ?? "").toLowerCase().trim();
}

function clean(value?: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function slug(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "").slice(0, 32) || "affiliate";
}
