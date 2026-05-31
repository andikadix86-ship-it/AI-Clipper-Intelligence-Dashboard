import { startSocialOAuth } from "@/lib/social-oauth-flow";
export const runtime = "nodejs";
export async function GET(request: Request) { return startSocialOAuth(request, "META"); }
