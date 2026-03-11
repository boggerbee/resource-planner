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
  { name: "NN_virksomhetsarkitekt", role: null, company: null, hourlyRateNok: 650, isInternal: true },
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
