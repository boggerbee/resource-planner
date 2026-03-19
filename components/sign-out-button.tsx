"use client"

import { keycloakSignOut } from "@/app/actions/sign-out"

export function SignOutButton() {
  return (
    <form action={keycloakSignOut}>
      <button
        type="submit"
        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        Logg ut
      </button>
    </form>
  )
}
