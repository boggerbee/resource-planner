"use server"

import { signOut } from "@/auth"
import { redirect } from "next/navigation"

export async function keycloakSignOut() {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER!
  const clientId = process.env.AUTH_KEYCLOAK_ID!
  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000"

  const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`)
  logoutUrl.searchParams.set("client_id", clientId)
  logoutUrl.searchParams.set("post_logout_redirect_uri", appUrl)

  await signOut({ redirect: false })
  redirect(logoutUrl.toString())
}
