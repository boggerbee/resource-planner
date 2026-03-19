import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (profile) {
        token.roles = (profile as any).realm_access?.roles ?? []
      }
      return token
    },
    session({ session, token }) {
      session.user.roles = (token.roles as string[]) ?? []
      return session
    },
  },
})
