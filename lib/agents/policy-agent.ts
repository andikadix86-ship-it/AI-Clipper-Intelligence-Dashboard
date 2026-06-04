import type { PolicyReview } from "./orchestration-types";
export function runPolicyAgent(value: unknown): PolicyReview {
  const text = JSON.stringify(value).toLowerCase(), sensitive = /guarantee|profit pasti|medical|health|finance|copyright|reupload/.test(text), affiliate = /affiliate|product|produk|keranjang|commission/.test(text);
  return { risk_level: sensitive ? "medium" : "low", disclosure_recommendation: affiliate || /ai|gemini/.test(text), originality_notes: ["Gunakan narasi, contoh, dan visual treatment original.", "Hindari reused content tanpa transformasi bermakna."], policy_notes: [...(sensitive ? ["Review manual diperlukan untuk klaim sensitif atau hak penggunaan."] : ["Tidak ada klaim berisiko tinggi yang terdeteksi."]), "Pastikan CTA dan metadata tidak menyesatkan."] };
}
