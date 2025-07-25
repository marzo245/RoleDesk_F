import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const realmId = requestUrl.searchParams.get("realmId");
  const shareId = requestUrl.searchParams.get("shareId");
  // Usar NEXT_PUBLIC_BASE_URL si está definida, si no usar origin
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || requestUrl.origin;

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Si hay realmId y shareId, redirigir directamente al mundo compartido
  if (realmId && shareId) {
    return NextResponse.redirect(`${baseUrl}/play/${realmId}?shareId=${shareId}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${baseUrl}/app`);
}
