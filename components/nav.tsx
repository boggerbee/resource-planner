import Link from "next/link";
import { LastScenarioLink } from "./last-scenario-link";
import { SignOutButton } from "./sign-out-button";
import { auth } from "@/auth";
import { ROLES } from "@/lib/auth-utils";

export async function Nav() {
  const session = await auth();
  const roles: string[] = (session?.user as any)?.roles ?? [];
  const isAdmin = roles.includes(ROLES.ADMIN);
  const isRW = roles.includes(ROLES.RW);

  const roleBadge = isAdmin ? "Admin" : isRW ? "Read-write" : "Read-only";
  const roleBadgeColor = isAdmin
    ? "bg-red-100 text-red-700"
    : isRW
    ? "bg-blue-100 text-blue-700"
    : "bg-gray-100 text-gray-600";

  return (
    <nav className="border-b bg-white">
      <div className="max-w-screen-xl mx-auto px-4 flex h-14 items-center gap-6">
        <Link href="/" className="font-semibold text-gray-900">
          Resource Planner
        </Link>
        <div className="flex gap-4 text-sm text-gray-600 flex-1">
          {isAdmin && (
            <>
              {[
                { href: "/teams", label: "Team" },
                { href: "/resources", label: "Ressurser" },
                { href: "/companies", label: "Firma" },
                { href: "/competencies", label: "Kompetanser" },
                { href: "/tags", label: "Merkelapper" },
                { href: "/scenarios", label: "Scenarier" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}
          {(isAdmin || isRW) && (
            <LastScenarioLink
              cookieName="lastAllocationScenario"
              baseHref="/allocations"
              label="Allokeringer"
            />
          )}
          <Link href="/reports/teams" className="hover:text-gray-900 transition-colors">
            Teamoversikt
          </Link>
          <LastScenarioLink
            cookieName="lastPortfolioScenario"
            baseHref="/reports/portfolio"
            label="Portefølje"
          />
          {isAdmin && (
            <Link href="/settings" className="hover:text-gray-900 transition-colors">
              Innstillinger
            </Link>
          )}
        </div>
        {session?.user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-700">{session.user.name}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadgeColor}`}>
              {roleBadge}
            </span>
            <SignOutButton />
          </div>
        )}
      </div>
    </nav>
  );
}
