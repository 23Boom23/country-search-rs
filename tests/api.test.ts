import { afterEach, expect, it, vi } from "vitest";
import { HttpError, searchCountries } from "../src/api.js";
afterEach(() => vi.unstubAllGlobals());
it("encodes the name, forwards the signal and returns JSON", async () => {
  const signal = new AbortController().signal;
  const fetchMock = vi
    .fn()
    .mockResolvedValue(Response.json([{ name: "New Zealand" }]));
  vi.stubGlobal("fetch", fetchMock);
  await expect(searchCountries("New Zealand", signal)).resolves.toEqual([
    { name: "New Zealand" },
  ]);
  expect(fetchMock).toHaveBeenCalledWith(
    "https://countries.dev/name/New%20Zealand",
    { signal },
  );
});
it("returns an empty list on 404", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
  );
  await expect(
    searchCountries("unknown", new AbortController().signal),
  ).resolves.toEqual([]);
});
it("throws HttpError with the status on other HTTP failures", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
  );
  const result = searchCountries("spain", new AbortController().signal);
  await expect(result).rejects.toBeInstanceOf(HttpError);
  await expect(result).rejects.toMatchObject({ status: 503 });
});
