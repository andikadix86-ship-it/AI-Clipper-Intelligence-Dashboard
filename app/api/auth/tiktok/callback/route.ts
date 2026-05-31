import { callbackSocialOAuth } from "@/lib/social-oauth-flow";
export const runtime = "nodejs";
export async function GET(request: Request) { return callbackSocialOAuth(request, "TIKTOK"); }
