import { NextResponse, type NextRequest } from "next/server";

// const publicRoutes = new Set(["/", "/about-us", "/guides", "/register"]); Login is not required for this project, so public routes are not needed

export function proxy(request: NextRequest) {
  // const { pathname } = request.nextUrl; Login is not required for this project, so pathname is not needed
  void request;

  return NextResponse.next();

  /*
  if (publicRoutes.has(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("cv_session")?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  const registerUrl = request.nextUrl.clone();
  registerUrl.pathname = "/register";
  registerUrl.searchParams.set("redirect", pathname);

  return NextResponse.redirect(registerUrl);
  */
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
