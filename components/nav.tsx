import Link from "next/link";

const navLinks = [
  { href: "/teams", label: "Team" },
  { href: "/resources", label: "Ressurser" },
  { href: "/companies", label: "Firma" },
  { href: "/competencies", label: "Kompetanser" },
  { href: "/allocations", label: "Allokeringer" },
  { href: "/reports/portfolio", label: "Rapporter" },
];

export function Nav() {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-screen-xl mx-auto px-4 flex h-14 items-center gap-6">
        <Link href="/" className="font-semibold text-gray-900">
          Resource Planner
        </Link>
        <div className="flex gap-4 text-sm text-gray-600">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
