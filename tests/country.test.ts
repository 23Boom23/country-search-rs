import { expect, it } from "vitest";
import { mapCountryResponse } from "../src/country.js";
it("maps an API fixture to independent display data", () => {
  const raw = {
    name: "Iceland",
    capital: "Reykjavik",
    region: "Europe",
    population: 389000,
    flags: { svg: "flag.svg" },
    languages: [{ name: "Icelandic" }],
    currencies: [{ name: "Icelandic króna" }],
    borders: ["ABC"],
    area: 103000,
  };
  const mapped = mapCountryResponse(raw);
  expect(mapped).toMatchObject({
    name: "Iceland",
    capital: "Reykjavik",
    region: "Europe",
    population: 389000,
    flag: "flag.svg",
    languages: ["Icelandic"],
    currencies: ["Icelandic króna"],
    area: 103000,
  });
  expect(mapped.borders).not.toBe(raw.borders);
});
it("supplies defaults for remote fields that can be absent", () => {
  expect(mapCountryResponse({ name: "Antarctica" })).toMatchObject({
    languages: [],
    borders: [],
    currencies: [],
    population: null,
    capital: "—",
  });
});
