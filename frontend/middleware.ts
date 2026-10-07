import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


const PROTECTED_PATH = "/admin-samass-98342";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;


  if (pathname.startsWith(`${PROTECTED_PATH}/login`)) {
    return NextResponse.next();
  }

  
  const token = req.cookies.get("samass_admin_session");

  if (!token) {
    const loginUrl = new URL(`${PROTECTED_PATH}/login`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}


export const config = {
  matcher: ["/admin-samass-98342/:path*"],
};
