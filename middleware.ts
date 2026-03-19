import { auth } from "./auth"
import { NextResponse } from "next/server"

const ADMIN_PATHS = [
  "/teams",
  "/resources",
  "/companies",
  "/competencies",
  "/tags",
  "/scenarios",
  "/settings",
]
const RW_PATHS = ["/allocations"]

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/api/auth")
  ) {
    return
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL("/api/auth/signin", req.url))
  }

  const roles: string[] = (req.auth.user as any)?.roles ?? []
  const isAdmin = roles.includes("resource-planner-admin")
  const isRW = roles.includes("resource-planner-rw")

  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && !isAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }
  if (RW_PATHS.some((p) => pathname.startsWith(p)) && !isAdmin && !isRW) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
