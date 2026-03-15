import Link from "next/link";
import { LastScenarioLink } from "./last-scenario-link";

export function Nav() {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-screen-xl mx-auto px-4 flex h-14 items-center gap-6">
        <Link href="/" className="font-semibold text-gray-900">
          Resource Planner
        </Link>
        <div className="flex gap-4 text-sm text-gray-600">
          {[
            { href: "/teams", label: "Team" },
            { href: "/resources", label: "Ressurser" },
            { href: "/companies", label: "Firma" },
            { href: "/competencies", label: "Kompetanser" },
            { href: "/tags", label: "Merkelapper" },
            { href: "/scenarios", label: "Scenarier" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gray-900 transition-colors">
              {link.label}
            </Link>
          ))}
          <LastScenarioLink cookieName="lastAllocationScenario" baseHref="/allocations" label="Allokeringer" />
          <Link href="/reports/teams" className="hover:text-gray-900 transition-colors">Teamoversikt</Link>
          <LastScenarioLink cookieName="lastPortfolioScenario" baseHref="/reports/portfolio" label="Portefølje" />
          <Link href="/settings" className="hover:text-gray-900 transition-colors">Innstillinger</Link>
        </div>
      </div>
    </nav>
  );
}
