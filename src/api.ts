export class HttpError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

export interface RawCountry {
  name: string;
  flag?: string;
  flags?: { svg?: string; png?: string };
  capital?: string;
  region?: string;
  population?: number;
  languages?: { name: string }[];
  currencies?: { name: string; code?: string }[];
  description?: string;
  area?: number;
  borders?: string[];
}

export async function searchCountries(
  query: string,
  signal: AbortSignal,
): Promise<RawCountry[]> {
  const response = await fetch(
    `https://countries.dev/name/${encodeURIComponent(query)}`,
    { signal },
  );

  if (!response.ok) {
    // A missing match is an empty result.
    if (response.status === 404) return [];
    throw new HttpError(response.status);
  }

  return response.json();
}
