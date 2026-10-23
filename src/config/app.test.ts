import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CAMPUSES, CATEGORIES, campusForEmail, categoryLabel } from "./app";

describe("campusForEmail", () => {
  it.each([
    ["student@ncsu.edu", "ncsu"],
    ["student@unc.edu", "unc"],
    ["student@duke.edu", "duke"],
  ])("accepts %s", (email, campusId) => {
    expect(campusForEmail(email)?.id).toBe(campusId);
  });

  it("accepts campus subdomains", () => {
    expect(campusForEmail("jane@students.ncsu.edu")?.id).toBe("ncsu");
    expect(campusForEmail("jane@email.unc.edu")?.id).toBe("unc");
  });

  it("ignores letter case and surrounding spaces", () => {
    expect(campusForEmail("  Jane.Doe@NCSU.EDU  ")?.id).toBe("ncsu");
  });

  it.each([
    ["a personal address", "me@gmail.com"],
    ["the wrong top-level domain", "me@ncsu.com"],
    ["a look-alike that ends with the real domain name", "me@fakencsu.edu"],
    ["a look-alike that starts with the real domain name", "me@ncsu.edu.evil.com"],
    ["a different school", "me@wfu.edu"],
    ["a second @ that hides a fake domain", "me@evil.com@ncsu.edu"],
    ["no @ sign", "ncsu.edu"],
    ["an empty string", ""],
  ])("rejects %s", (_label, email) => {
    expect(campusForEmail(email)).toBeNull();
  });
});

describe("categoryLabel", () => {
  it("returns the readable label for a known category", () => {
    expect(categoryLabel("parking")).toBe("Parking passes");
  });

  it("falls back to the raw id for an unknown category", () => {
    expect(categoryLabel("mystery")).toBe("mystery");
  });
});

describe("config stays consistent with the database schema", () => {
  const sql = readFileSync(resolve(process.cwd(), "supabase/schema.sql"), "utf8");

  it("every campus in the app is seeded in the database", () => {
    for (const campus of CAMPUSES) {
      const seedLine = sql.split("\n").find((line) => line.includes(`'${campus.id}'`) && line.includes(`'${campus.domain}'`));
      expect(seedLine, `schema.sql is missing campus ${campus.id}`).toBeDefined();
    }
  });

  it("the category list matches the database enum", () => {
    const block = sql.match(/listing_category as enum\s*\(([^)]*)\)/)?.[1] ?? "";
    const inDatabase = [...block.matchAll(/'([a-z]+)'/g)].map((m) => m[1]).sort();
    const inApp = CATEGORIES.map((c) => c.id).sort();
    expect(inApp).toEqual(inDatabase);
  });

  it("campus ids and domains are unique", () => {
    expect(new Set(CAMPUSES.map((c) => c.id)).size).toBe(CAMPUSES.length);
    expect(new Set(CAMPUSES.map((c) => c.domain)).size).toBe(CAMPUSES.length);
  });
});
