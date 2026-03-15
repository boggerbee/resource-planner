"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function LastScenarioLink({
  cookieName,
  baseHref,
  label,
}: {
  cookieName: string;
  baseHref: string;
  label: string;
}) {
  const pathname = usePathname();
  const [href, setHref] = useState(baseHref);

  useEffect(() => {
    const id = readCookie(cookieName);
    setHref(id ? `${baseHref}?scenarioId=${id}` : baseHref);
  }, [pathname, cookieName, baseHref]);

  return (
    <Link href={href} className="hover:text-gray-900 transition-colors">
      {label}
    </Link>
  );
}
