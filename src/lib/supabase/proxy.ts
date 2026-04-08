import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッションのリフレッシュ（重要: getUser()を呼ぶことでセッションを最新に保つ）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証が必要なパスへのアクセス制御
  const { pathname } = request.nextUrl;

  // 静的ファイル・内部パスは認証チェックをスキップ
  if (pathname.startsWith("/_next/") || pathname.includes(".")) {
    return supabaseResponse;
  }

  // 認証不要ページ（未認証ユーザーがアクセスするページ）
  const isGuestPage =
    pathname.startsWith("/login") ||
    pathname === "/reset-password";

  // 認証フロー中のページ（認証済み・未認証どちらでもアクセス可能）
  const isAuthFlowPage =
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/reset-password/update");

  if (!user && !isGuestPage && !isAuthFlowPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isGuestPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
