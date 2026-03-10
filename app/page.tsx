import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const sections = [
  {
    title: "Masterdata",
    links: [
      { href: "/teams", label: "Team" },
      { href: "/resources", label: "Ressurser" },
      { href: "/companies", label: "Firma" },
      { href: "/competencies", label: "Kompetanser" },
    ],
  },
  {
    title: "Planlegging",
    links: [{ href: "/allocations", label: "Allokeringer" }],
  },
  {
    title: "Rapporter",
    links: [
      { href: "/reports/portfolio", label: "Porteføljeoversikt" },
      { href: "/reports/team", label: "Teamrapport" },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resource Planner</h1>
        <p className="text-muted-foreground mt-1">
          Bemanningsplanlegging for produktteam
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription>
                <ul className="mt-2 space-y-1">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-blue-600 hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardDescription>

            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
