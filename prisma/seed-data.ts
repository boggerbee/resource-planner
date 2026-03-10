/**
 * Seed data — generert fra Excel, klar for manuell vasking.
 *
 * Konvensjoner:
 *  - months: [jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, des]
 *  - verdier er 0.0–1.0 (prosent som desimal: 0.5 = 50 %)
 *  - 0 betyr ikke allokert
 *  - company: null = ikke avklart, rett opp manuelt
 *  - hourlyRateNok: ekskl. mva
 */

// Selskapsnavn funnet i kildedata:
// Bouvet, Cognizant Worldwide Limited, Consid, Inventura, Knowit, Natural Partner, Overhuset, Software AG, Twoday AS

export type ResourceEntry = {
  name: string;
  role: string | null;
  /** Selskapsnavn — sett til null hvis ukjent/intern */
  company: string | null;
  /** Timepris eks. mva */
  hourlyRateNok: number | null;
  /** true = fast ansatt (intern), false = konsulent (ekstern) */
  isInternal: boolean;
};

export type TeamEntry = {
  name: string;
  projectCode: string;
};

export type AllocationEntry = {
  resource: string;
  projectCode: string;
  /** [jan, feb, ..., des] — 0.0 til 1.0 */
  months: [number,number,number,number,number,number,number,number,number,number,number,number];
};

// ─── Ressurser ────────────────────────────────────────────────────────────
//
// Sjekk og rett opp:
//  - company: null der selskap ikke er avklart
//  - isInternal: sett til true for faste ansatte
//  - role: standardiser jobbroller

export const resources: ResourceEntry[] = [
  { name: "Paul Svendsen", role: null, company: "Bouvet", hourlyRateNok: 1660, isInternal: false },
  { name: "Andreas Lund", role: null, company: "Knowit", hourlyRateNok: 1825, isInternal: false },
  { name: "Jørgen Sølvernes Sandnes", role: null, company: "Knowit", hourlyRateNok: 1825, isInternal: false },
  { name: "Jørn Pedersen", role: null, company: "Natural Partner", hourlyRateNok: 1793, isInternal: false },
  { name: "Lars-Erik-Moen-Bjørk", role: null, company: "Overhuset", hourlyRateNok: 1914, isInternal: false },
  { name: "Terje Wallem", role: null, company: "Overhuset", hourlyRateNok: 1795, isInternal: false },
  { name: "Trond Bolsø", role: null, company: "Overhuset", hourlyRateNok: 1975, isInternal: false },
  { name: "Adem L", role: null, company: "Natural Partner", hourlyRateNok: 1793, isInternal: false },
  { name: "Anne Hole", role: null, company: "Natural Partner", hourlyRateNok: 1793, isInternal: false },
  { name: "Matthias Mühlbauer", role: null, company: "Software AG", hourlyRateNok: 2045, isInternal: false },
  { name: "Magnus Lefdal", role: null, company: "Knowit", hourlyRateNok: 1500, isInternal: false },
  { name: "Torbjørn Aase", role: "fullstack", company: "Knowit", hourlyRateNok: 1500, isInternal: false },
  { name: "Therese Hagen", role: "UX-designer", company: "Twoday AS", hourlyRateNok: 1503, isInternal: false },
  { name: "Roberto Papa", role: "dataarkitekt", company: "Cognizant Worldwide Limited", hourlyRateNok: 1650, isInternal: false },
  { name: "Lilly Murud", role: "tjenestedesigner", company: "Consid", hourlyRateNok: 1290, isInternal: false },
  { name: "Danh Nguyen", role: "fullstackutvikler", company: "Consid", hourlyRateNok: 1414, isInternal: false },
  { name: "Kim Andre Pollvik", role: "fullstackutvikler", company: "Consid", hourlyRateNok: 1366, isInternal: false },
  { name: "NN", role: "Frontendutvikler", company: "Bouvet", hourlyRateNok: 1600, isInternal: false },
  { name: "Petter Sommerseth", role: "UX-designer", company: "Consid", hourlyRateNok: 1265, isInternal: false },
  { name: "Dag Thomas Nybø-Sørensen", role: "Jurist?", company: "Inventura", hourlyRateNok: 1865, isInternal: false },
  { name: "NN_kommunedialog", role: "På kunnskap", company: null, hourlyRateNok: 1603, isInternal: false },
  { name: "Ida S Gustavsen", role: null, company: "Consid", hourlyRateNok: 1211, isInternal: false },
  { name: "NN", role: null, company: "Bouvet", hourlyRateNok: 1600, isInternal: false },
  { name: "Åsmund Staldvik", role: "Frontendutvikler", company: null, hourlyRateNok: 1588, isInternal: false },
  { name: "Morten Kristoffersen", role: null, company: null, hourlyRateNok: 1456, isInternal: false },
  { name: "NN Kjernebank", role: null, company: null, hourlyRateNok: 1600, isInternal: false },
  { name: "Pia Wold Nilsen", role: "Fullstackutvikler", company: "Bouvet", hourlyRateNok: 1647, isInternal: false },
  { name: "NN KOBO", role: "Fullstackutvikler (erstatter Gullbekk)", company: null, hourlyRateNok: 1600, isInternal: false },
  { name: "Therese Hanshus", role: "Forretningsutvikler", company: "Knowit", hourlyRateNok: 1290, isInternal: false },
  { name: "Sigrun Strømsøyen", role: "Programleder Lån og Tilskudd", company: "Consid", hourlyRateNok: 1605, isInternal: false },
  { name: "NN", role: null, company: "Bouvet", hourlyRateNok: 1650, isInternal: false },
  { name: "Internt ansatte på post 45", role: null, company: null, hourlyRateNok: null, isInternal: false },
  { name: "Christine Heggum", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Hanna Nilsen", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Jan Hansen", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Skjalg Mæhre", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "NN", role: null, company: "Bouvet", hourlyRateNok: 650, isInternal: false },
  { name: "Brett Alistair Kromkamp", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Morten Sjåstad", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Sturla Solheim", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Suman Sooch", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Asbjørn Bjørge", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Ana Elena Buleu", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Adrian Johansen", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Simen Bentdal", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Thomas Bullock", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "Lene A. Tilley Holmboe", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "NN_virksomhetsarkitekt", role: null, company: null, hourlyRateNok: 650, isInternal: false },
  { name: "NN_teamlead", role: null, company: null, hourlyRateNok: 650, isInternal: false },
];

// ─── Team ─────────────────────────────────────────────────────────────────

export const teams: TeamEntry[] = [
  { name: "Forvaltning HILS/Vinnbin (SOFT)", projectCode: "FU037" },
  { name: "SLT X / Nye løsninger lån og tilskudd", projectCode: "FU042" },
  { name: "Selvbetjening og låneforvaltning (SLT)", projectCode: "FU040" },
  { name: "Kjernebank", projectCode: "FU041" },
  { name: "Startlån", projectCode: "FU010" },
  { name: "Kobo", projectCode: "FU030" },
  { name: "Datateamet", projectCode: "FU003" },
  { name: "Kundedialog", projectCode: "FU042-SD074Kundedialog" },
  { name: "Husbanken.no", projectCode: "FU027" },
  { name: "Plattform", projectCode: "FU035" },
  { name: "Forvaltning Bostøtte - Bjørn Gulbrandsen", projectCode: "FU008" },
];

// ─── Allokeringer ─────────────────────────────────────────────────────────
//
// months = [jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, des]
// Sjekk at resource-navn matcher entries i resources[] ovenfor.

export const allocations: AllocationEntry[] = [
  { resource: "Jørn Pedersen", projectCode: "FU037", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Lars-Erik-Moen-Bjørk", projectCode: "FU037", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Adem L", projectCode: "FU037", months: [0.3, 0.3, 0.3, 0.1, 0.1, 0.1, 0, 0.5, 0.5, 0.5, 0.5, 0.75] },
  { resource: "Anne Hole", projectCode: "FU037", months: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0, 0.3, 0.3, 0.5, 0.5, 0.75] },
  { resource: "Matthias Mühlbauer", projectCode: "FU037", months: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 0.5, 0.5, 0] },
  { resource: "Morten Kristoffersen", projectCode: "FU037", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Paul Svendsen", projectCode: "FU042", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Terje Wallem", projectCode: "FU042", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Trond Bolsø", projectCode: "FU042", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Kim Andre Pollvik", projectCode: "FU042", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Åsmund Staldvik", projectCode: "FU042", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Therese Hanshus", projectCode: "FU042", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Dag Thomas Nybø-Sørensen", projectCode: "FU041", months: [0.2, 0.2, 0.2, 0.2, 0.15, 0.25, 0.2, 0.3, 0.3, 0.2, 0.2, 0.2] },
  { resource: "Sigrun Strømsøyen", projectCode: "FU041", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Therese Hagen", projectCode: "FU010", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Danh Nguyen", projectCode: "FU010", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Jørgen Sølvernes Sandnes", projectCode: "FU030", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Torbjørn Aase", projectCode: "FU030", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Petter Sommerseth", projectCode: "FU030", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Ida S Gustavsen", projectCode: "FU030", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Pia Wold Nilsen", projectCode: "FU030", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "NN KOBO", projectCode: "FU030", months: [0, 0, 0.2, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Roberto Papa", projectCode: "FU003", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Lilly Murud", projectCode: "FU003", months: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { resource: "Lilly Murud", projectCode: "FU042-SD074Kundedialog", months: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { resource: "Magnus Lefdal", projectCode: "FU035", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
  { resource: "Andreas Lund", projectCode: "FU008", months: [1, 1, 1, 1, 1, 1, 0.2, 1, 1, 1, 1, 0.75] },
];
