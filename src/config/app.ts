// One place to rename the product or add a campus.
export const APP_NAME = "Repo";
export const APP_TAGLINE =
  "The student marketplace for dorm gear, game-day passes, tickets and subleases.";

export const CAMPUSES = [
  { id: "ncsu", name: "NC State", domain: "ncsu.edu" },
  { id: "unc", name: "UNC Chapel Hill", domain: "unc.edu" },
  { id: "duke", name: "Duke", domain: "duke.edu" },
] as const;

export const CATEGORIES = [
  { id: "dorm", label: "Dorm essentials" },
  { id: "clothes", label: "Clothes" },
  { id: "parking", label: "Parking passes" },
  { id: "tickets", label: "Tickets" },
  { id: "sublease", label: "Subleases" },
  { id: "other", label: "Other" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Returns the campus for an email, or null if it is not an allowed .edu address. */
export function campusForEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return null;
  return (
    CAMPUSES.find((c) => domain === c.domain || domain.endsWith("." + c.domain)) ?? null
  );
}

export const MAX_PHOTOS = 4;
