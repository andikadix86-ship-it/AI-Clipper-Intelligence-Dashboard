import type { AffiliateProductInsightDto, ProductContentFormat, ProductContentStrategy, ProductOpportunityScore } from "../intelligence/types";
import { calculateAffiliateProductScore, type AffiliateProductScoreInput } from "./product-scoring";

export type ProductContentStrategyInput = AffiliateProductScoreInput & Partial<Pick<AffiliateProductInsightDto, "notes" | "productUrl" | "sourceUrl">>;

export function generateProductContentStrategy(product: ProductContentStrategyInput, score: ProductOpportunityScore = calculateAffiliateProductScore(product)): ProductContentStrategy {
  const productName = clean(product.productName) || "produk ini";
  const category = clean(product.category) || "produk affiliate";
  const format = bestContentFormat(product, score);
  const cta = ctaForPlatform(product.platform, productName);
  const angle = contentAngle(product, score, format);
  const hooks = hookIdeas(productName, category, format, product.competitionLevel === "High");

  return {
    bestContentFormat: format,
    contentAngle: angle,
    hookIdeas: hooks,
    shortScript: {
      openingHook: hooks[0],
      problem: problemLine(productName, category, format),
      productSolution: `${productName} diposisikan sebagai solusi praktis yang bisa dilihat langsung cara pakainya.`,
      proofOrBenefit: proofLine(product, score),
      CTA: cta
    },
    caption: caption(productName, category, format, score),
    hashtagSet: hashtagSet(product, format),
    CTA: cta,
    platformRecommendation: platformRecommendation(product.platform, format, product.competitionLevel === "High"),
    postingDifficulty: postingDifficulty(score, product.competitionLevel),
    testingPlan: testingPlan(score, product.competitionLevel)
  };
}

function bestContentFormat(product: ProductContentStrategyInput, score: ProductOpportunityScore): ProductContentFormat {
  const category = normalized(product.category);
  if (isFashionMuslim(category)) return "Islamic soft selling";
  if (isBeauty(category)) return score.contentEaseScore >= 70 ? "Beauty transformation" : "Before-after";
  if (isMomBaby(category)) return "Mom solution";
  if (isHomeLiving(category)) return "Home improvement";
  if (product.competitionLevel === "High") return "Comparison video";
  if (isEducationOrDigital(category)) return "Educational soft selling";
  if (hasProblemSolutionSignal(product)) return "Problem solution demo";
  if (score.demandScore >= 72 && score.contentEaseScore >= 72) return score.trustScore >= 75 ? "Review natural" : "UGC style";
  if (score.contentEaseScore >= 74) return "UGC style";
  return "Story selling";
}

function contentAngle(product: ProductContentStrategyInput, score: ProductOpportunityScore, format: ProductContentFormat) {
  const productName = clean(product.productName) || "produk ini";
  const category = clean(product.category) || "kategori ini";
  if (product.competitionLevel === "High") return `Angle unik: bandingkan ${productName} dengan alternatif sejenis, fokus pada problem spesifik, harga, bukti manfaat, dan alasan kenapa produk ini layak dites.`;
  if (score.finalOpportunityScore < 40) return `Testing ringan untuk ${productName}: validasi demand dulu dengan satu angle sederhana sebelum scale konten.`;
  if (format === "Islamic soft selling") return `Tampilkan ${productName} secara santun, rapi, dan relevan untuk aktivitas muslimah tanpa klaim berlebihan.`;
  if (format === "Beauty transformation" || format === "Before-after") return `Perlihatkan perubahan visual yang realistis sebelum dan sesudah memakai ${productName}.`;
  if (format === "Mom solution") return `Sorot masalah harian ibu muda, lalu tunjukkan bagaimana ${productName} membuat rutinitas lebih mudah.`;
  if (format === "Home improvement") return `Tunjukkan kondisi rumah sebelum dipakai, proses penggunaan, dan hasil akhir yang lebih rapi atau praktis.`;
  if (format === "Educational soft selling") return `Ajarkan satu tips singkat di ${category}, lalu posisikan ${productName} sebagai shortcut yang membantu.`;
  if (format === "Problem solution demo") return `Mulai dari pain point nyata, demo solusi memakai ${productName}, lalu tutup dengan manfaat paling mudah dibuktikan.`;
  if (format === "UGC style") return `Buat cerita first-person seperti pemakaian harian, bukan hard selling.`;
  if (format === "Review natural") return `Review natural berbasis pengalaman pakai, cocok karena demand dan trust produk cukup kuat.`;
  return `Bangun cerita pendek tentang situasi pengguna sebelum mengenal ${productName}.`;
}

function hookIdeas(productName: string, category: string, format: ProductContentFormat, highCompetition: boolean): [string, string, string] {
  if (highCompetition) {
    return [
      `Banyak yang jual produk mirip, tapi aku cek ${productName} dari sisi ini...`,
      `Jangan checkout ${category} sebelum bandingin tiga hal ini.`,
      `Ini angle unik yang jarang dibahas dari ${productName}.`
    ];
  }
  if (format === "Islamic soft selling") {
    return [
      `Mau tampil rapi dan tetap nyaman buat aktivitas harian?`,
      `Aku cari ${category} yang simple, sopan, dan gampang dipadukan.`,
      `Ini alasan ${productName} cocok buat gaya harian yang lebih tenang.`
    ];
  }
  if (format === "Beauty transformation" || format === "Before-after") {
    return [
      `Aku coba ${productName} dan ini perubahan yang paling keliatan.`,
      `Kalau kamu punya masalah ini, lihat before-after-nya dulu.`,
      `Jangan beli skincare atau beauty product sebelum cek hasil realistisnya.`
    ];
  }
  if (format === "Mom solution") {
    return [
      `Ibu-ibu sering ngalamin masalah ini? Ini solusi simpelnya.`,
      `Aku cari cara biar rutinitas anak lebih praktis, ternyata ini membantu.`,
      `${productName} ini kecil, tapi efeknya ke rutinitas harian lumayan terasa.`
    ];
  }
  if (format === "Home improvement") {
    return [
      `Area rumah ini tadinya berantakan, lalu aku coba cara simpel ini.`,
      `Kalau mau rumah lebih rapi tanpa effort besar, lihat demo ini.`,
      `${productName} bikin sudut rumah ini jauh lebih praktis.`
    ];
  }
  if (format === "Educational soft selling") {
    return [
      `Kalau kamu baru mulai di ${category}, pahami satu hal ini dulu.`,
      `Tools ini bukan magic, tapi bisa bantu kerja lebih cepat kalau dipakai benar.`,
      `Ini cara praktis memakai ${productName} tanpa workflow yang ribet.`
    ];
  }
  return [
    "Sering ngalamin masalah ini? Coba lihat solusi simpel ini...",
    `Aku kira ${productName} biasa aja, ternyata ada detail yang berguna.`,
    `Ini alasan kenapa ${category} mulai banyak dicari.`
  ];
}

function problemLine(productName: string, category: string, format: ProductContentFormat) {
  if (format === "Comparison video") return `Audience bingung memilih ${category} karena banyak produk mirip dan klaimnya hampir sama.`;
  if (format === "Educational soft selling") return `Audience butuh cara memahami ${category} tanpa proses yang terlalu teknis.`;
  if (format === "Beauty transformation") return `Audience ingin bukti visual yang realistis sebelum percaya pada klaim ${productName}.`;
  if (format === "Mom solution") return `Rutinitas keluarga sering butuh solusi yang cepat, aman, dan mudah dipakai.`;
  if (format === "Home improvement") return `Masalah rumah biasanya terlihat kecil, tapi mengganggu kenyamanan harian.`;
  return `Audience punya masalah praktis di ${category} dan butuh solusi yang mudah dicoba.`;
}

function proofLine(product: ProductContentStrategyInput, score: ProductOpportunityScore) {
  const sales = product.salesVolume && product.salesVolume > 0 ? `${Math.round(product.salesVolume).toLocaleString("id-ID")} sales` : "sinyal demand awal";
  const margin = product.commissionRate && product.commissionRate > 0 ? `${product.commissionRate}% komisi` : "margin perlu divalidasi";
  return `Gunakan bukti visual, review singkat, ${sales}, rating/review jika tersedia, dan konteks ${margin}. Score produk saat ini ${score.finalOpportunityScore}/100.`;
}

function caption(productName: string, category: string, format: ProductContentFormat, score: ProductOpportunityScore) {
  const scaleNote = score.finalOpportunityScore < 40 ? "Test kecil dulu, jangan langsung scale." : "Simpan dulu supaya gampang dicek saat promo aktif.";
  return `${productName} bisa jadi opsi menarik di ${category} untuk konten ${format}. ${scaleNote}`;
}

function hashtagSet(product: ProductContentStrategyInput, format: ProductContentFormat) {
  const category = clean(product.category) || "affiliate";
  const platform = clean(product.platform) || "marketplace";
  return [
    "#affiliateindonesia",
    `#${slug(category)}`,
    `#${slug(platform)}`,
    `#${slug(format)}`,
    "#reviewproduk"
  ];
}

function ctaForPlatform(platform?: AffiliateProductInsightDto["platform"], productName = "produk ini") {
  const value = normalized(platform);
  if (value.includes("tiktok")) return `Follow untuk review berikutnya, save videonya, lalu cek keranjang kuning untuk lihat promo ${productName}.`;
  if (value.includes("instagram")) return `Save postingan ini, share ke teman yang butuh, follow untuk rekomendasi berikutnya, dan comment kalau mau versi comparison.`;
  if (value.includes("facebook")) return `Follow halaman ini, share ke teman yang butuh, dan comment kalau ingin detail pemakaian ${productName}.`;
  if (value.includes("youtube")) return `Like video ini, subscribe untuk review singkat berikutnya, dan comment produk yang mau dibandingkan.`;
  return `Save video ini, follow untuk rekomendasi berikutnya, dan cek link produk sebelum checkout.`;
}

function platformRecommendation(platform?: AffiliateProductInsightDto["platform"], format?: ProductContentFormat, highCompetition = false) {
  const value = normalized(platform);
  if (value.includes("tiktok")) return "TikTok short video + TikTok Shop product anchor.";
  if (value.includes("instagram")) return "Instagram Reels untuk reach cepat, lanjut carousel Story untuk FAQ.";
  if (value.includes("facebook")) return "Facebook Reels dengan hook problem-solution dan komentar sebagai diskusi.";
  if (format === "Educational soft selling") return "YouTube Shorts untuk edukasi evergreen, lalu potong ulang ke TikTok dan Instagram Reels.";
  if (highCompetition || format === "Comparison video") return "TikTok dan YouTube Shorts untuk comparison cepat, lalu gunakan Instagram Reels sebagai retargeting ringan.";
  return "TikTok dan Instagram Reels untuk validasi awal, lalu arahkan ke link marketplace atau affiliate.";
}

function postingDifficulty(score: ProductOpportunityScore, competitionLevel?: AffiliateProductInsightDto["competitionLevel"]): ProductContentStrategy["postingDifficulty"] {
  if (score.contentEaseScore < 50 || (score.finalOpportunityScore < 40 && competitionLevel === "High")) return "Hard";
  if (score.contentEaseScore < 74 || competitionLevel === "High") return "Medium";
  return "Easy";
}

function testingPlan(score: ProductOpportunityScore, competitionLevel?: AffiliateProductInsightDto["competitionLevel"]) {
  if (score.finalOpportunityScore < 40) return "Testing ringan: buat 1-2 video organik dengan budget rendah, jangan scale iklan sampai hook, komentar, dan klik produk mulai kuat.";
  if (competitionLevel === "High") return "Test 3 angle unik: comparison, problem-specific demo, dan price-value check. Scale hanya angle dengan save/comment terbaik.";
  if (score.finalOpportunityScore >= 80) return "Test 3-5 variasi hook dalam 7 hari, scale format dengan watch time dan klik produk tertinggi.";
  return "Test 2-3 video ringan dalam 5 hari, bandingkan hook review natural, problem-solution, dan UGC style.";
}

function hasProblemSolutionSignal(product: ProductContentStrategyInput) {
  const raw = product.rawData && typeof product.rawData === "object" && !Array.isArray(product.rawData) ? product.rawData as Record<string, unknown> : {};
  const text = normalized(`${product.productName ?? ""} ${product.category ?? ""} ${product.notes ?? ""} ${String(raw.contentDifficulty ?? "")}`);
  return /problem|solution|solusi|repair|anti|organizer|storage|vacuum|clean|compact|portable|easy|mudah|praktis|before|after/.test(text);
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

function isEducationOrDigital(value: string) {
  return /education|educational|edukasi|course|digital|ai tools|software|saas|template|ebook|membership|hosting|automation/.test(value);
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
