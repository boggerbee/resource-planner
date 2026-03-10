/**
 * One-time script: extract data from Excel into prisma/seed-data.ts
 *
 * Run with: node scripts/extract-seed-data.mjs
 */

import { createRequire } from "module";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const wb = XLSX.readFile(join(ROOT, "docs/input/Prognose konsulenter 2026_.xlsx"));

// ─── Companies from Bemanning (col 0=name, col 2=company) ─────────────────
const bmRows = XLSX.utils.sheet_to_json(wb.Sheets["Bemanning"], {
  header: 1,
  defval: null,
});
const companyByName = {};
for (const r of bmRows) {
  const name = r[0];
  const company = r[2];
  if (
    typeof name === "string" &&
    name.trim() &&
    typeof company === "string" &&
    company.trim()
  ) {
    companyByName[name.trim()] = company.trim();
  }
}

// ─── Resources from Ressurser sheet ──────────────────────────────────────
const rsRows = XLSX.utils.sheet_to_json(wb.Sheets["Ressurser"], {
  header: 1,
  defval: null,
});
let rsHeaderIdx = -1;
for (let i = 0; i < rsRows.length; i++) {
  if (rsRows[i].some((c) => typeof c === "string" && /timelønn/i.test(c))) {
    rsHeaderIdx = i;
    break;
  }
}

const resources = [];
for (let i = rsHeaderIdx + 1; i < rsRows.length; i++) {
  const r = rsRows[i];
  const rawName = r[0];
  if (!rawName || typeof rawName !== "string" || !rawName.trim()) continue;
  // Clean control characters (e.g. \x02 in one name)
  const name = rawName.replace(/[\x00-\x1F]/g, "-").trim();
  const role = r[1] ? String(r[1]).trim() : null;
  const company =
    companyByName[rawName.trim()] || companyByName[name] || null;
  const hourlyRateNok = typeof r[5] === "number" ? r[5] : null;
  resources.push({ name, role, company, hourlyRateNok });
}

// ─── Teams + allocations from team sheets ─────────────────────────────────
const SKIP = /(budsjett|ressurser|bemanning)/i;
const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "mai", "jun",
  "jul", "aug", "sep", "okt", "nov", "des",
];

const teams = [];
const allocations = [];
const usedCodes = new Set();

for (const sheetName of wb.SheetNames) {
  if (SKIP.test(sheetName)) continue;

  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: null,
  });

  const rawCode =
    rows[1] && rows[1][0] ? String(rows[1][0]).trim() : sheetName;
  const teamName =
    rows[0] && rows[0][0] ? String(rows[0][0]).trim() : sheetName;

  // Deduplicate project codes (FU042 appeared twice in the source)
  let projectCode = rawCode;
  if (usedCodes.has(projectCode)) {
    projectCode = `${rawCode}-${sheetName.replace(/\s+/g, "")}`;
  }
  usedCodes.add(projectCode);

  teams.push({ name: teamName, projectCode });

  // Find month header row
  let headerIdx = -1;
  let monthCols = [];
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const r = rows[i];
    const found = MONTH_KEYS.map((m) =>
      r.findIndex(
        (c) => typeof c === "string" && c.toLowerCase().includes(m)
      )
    );
    if (found.filter((x) => x >= 0).length >= 6) {
      headerIdx = i;
      monthCols = found;
      break;
    }
  }
  if (headerIdx < 0) continue;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const rawName = r[0];
    if (!rawName || typeof rawName !== "string" || !rawName.trim()) continue;
    const resourceName = rawName.replace(/[\x00-\x1F]/g, "-").trim();

    const months = {};
    let hasAny = false;
    for (let m = 0; m < 12; m++) {
      const col = monthCols[m];
      if (col < 0) continue;
      const v = r[col];
      if (typeof v === "number" && v > 0 && v <= 1) {
        months[m + 1] = v;
        hasAny = true;
      }
    }
    if (!hasAny) continue;

    allocations.push({ resource: resourceName, projectCode, months });
  }
}

// ─── Render as TypeScript ─────────────────────────────────────────────────

function renderMonths(months) {
  const parts = [];
  for (let m = 1; m <= 12; m++) {
    const v = months[m];
    parts.push(v !== undefined ? String(v) : "0");
  }
  return `[${parts.join(", ")}]`;
}

const lines = [];
lines.push(`/**`);
lines.push(` * Seed data — generert fra Excel, klar for manuell vasking.`);
lines.push(` *`);
lines.push(` * Konvensjoner:`);
lines.push(` *  - months: [jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, des]`);
lines.push(` *  - verdier er 0.0–1.0 (prosent som desimal: 0.5 = 50 %)`);
lines.push(` *  - 0 betyr ikke allokert`);
lines.push(` *  - company: null = ikke avklart, rett opp manuelt`);
lines.push(` *  - hourlyRateNok: ekskl. mva`);
lines.push(` */`);
lines.push(``);

// Company types (unique set for reference)
const companies = [...new Set(resources.map((r) => r.company).filter(Boolean))].sort();
lines.push(`// Selskapsnavn funnet i kildedata:`);
lines.push(`// ${companies.join(", ")}`);
lines.push(``);

lines.push(`export type ResourceEntry = {`);
lines.push(`  name: string;`);
lines.push(`  role: string | null;`);
lines.push(`  /** Selskapsnavn — sett til null hvis ukjent/intern */`);
lines.push(`  company: string | null;`);
lines.push(`  /** Timepris eks. mva */`);
lines.push(`  hourlyRateNok: number | null;`);
lines.push(`  /** true = fast ansatt (intern), false = konsulent (ekstern) */`);
lines.push(`  isInternal: boolean;`);
lines.push(`};`);
lines.push(``);
lines.push(`export type TeamEntry = {`);
lines.push(`  name: string;`);
lines.push(`  projectCode: string;`);
lines.push(`};`);
lines.push(``);
lines.push(`export type AllocationEntry = {`);
lines.push(`  resource: string;`);
lines.push(`  projectCode: string;`);
lines.push(`  /** [jan, feb, ..., des] — 0.0 til 1.0 */`);
lines.push(`  months: [number,number,number,number,number,number,number,number,number,number,number,number];`);
lines.push(`};`);
lines.push(``);

// Resources
lines.push(`// ─── Ressurser ────────────────────────────────────────────────────────────`);
lines.push(`//`);
lines.push(`// Sjekk og rett opp:`);
lines.push(`//  - company: null der selskap ikke er avklart`);
lines.push(`//  - isInternal: sett til true for faste ansatte`);
lines.push(`//  - role: standardiser jobbroller`);
lines.push(``);
lines.push(`export const resources: ResourceEntry[] = [`);
for (const r of resources) {
  const name = JSON.stringify(r.name);
  const role = r.role ? JSON.stringify(r.role) : "null";
  const company = r.company ? JSON.stringify(r.company) : "null";
  const rate = r.hourlyRateNok !== null ? r.hourlyRateNok : "null";
  lines.push(`  { name: ${name}, role: ${role}, company: ${company}, hourlyRateNok: ${rate}, isInternal: false },`);
}
lines.push(`];`);
lines.push(``);

// Teams
lines.push(`// ─── Team ─────────────────────────────────────────────────────────────────`);
lines.push(``);
lines.push(`export const teams: TeamEntry[] = [`);
for (const t of teams) {
  lines.push(`  { name: ${JSON.stringify(t.name)}, projectCode: ${JSON.stringify(t.projectCode)} },`);
}
lines.push(`];`);
lines.push(``);

// Allocations
lines.push(`// ─── Allokeringer ─────────────────────────────────────────────────────────`);
lines.push(`//`);
lines.push(`// months = [jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, des]`);
lines.push(`// Sjekk at resource-navn matcher entries i resources[] ovenfor.`);
lines.push(``);
lines.push(`export const allocations: AllocationEntry[] = [`);
for (const a of allocations) {
  const arr = [];
  for (let m = 1; m <= 12; m++) {
    arr.push(a.months[m] !== undefined ? a.months[m] : 0);
  }
  lines.push(`  { resource: ${JSON.stringify(a.resource)}, projectCode: ${JSON.stringify(a.projectCode)}, months: [${arr.join(", ")}] },`);
}
lines.push(`];`);
lines.push(``);

const output = lines.join("\n");
writeFileSync(join(ROOT, "prisma/seed-data.ts"), output, "utf8");
console.log(`✅ prisma/seed-data.ts generert`);
console.log(`   ${resources.length} ressurser`);
console.log(`   ${teams.length} team`);
console.log(`   ${allocations.length} allokeringer`);
console.log(`\nKjør: node scripts/extract-seed-data.mjs for å regenerere fra Excel.`);
