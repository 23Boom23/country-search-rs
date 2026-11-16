import type { RawCountry } from "./api.js";
export function mapCountryResponse(raw: RawCountry) {
  return {
    name: raw.name,
    flag: raw.flags?.svg ?? raw.flags?.png ?? raw.flag ?? "",
    capital: raw.capital || "—",
    region: raw.region || "—",
    population: raw.population ?? null,
    languages: (raw.languages ?? []).map(({ name }) => name),
    currencies: (raw.currencies ?? []).map(({ name }) => name),
    description: raw.description ?? "",
    area: raw.area ?? null,
    borders: [...(raw.borders ?? [])],
  };
}
export type Country = ReturnType<typeof mapCountryResponse>;
