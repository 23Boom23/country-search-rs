import { afterEach, expect, it, vi } from "vitest";
import { createSearch } from "../src/search.js";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("does not fetch empty input and treats a 404 as no results", async () => {
  vi.useFakeTimers();
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 404 }));
  vi.stubGlobal("fetch", fetchMock);
  const show = vi.fn();
  const search = createSearch(show);
  search.update("   ");
  await vi.runAllTimersAsync();
  expect(fetchMock).not.toHaveBeenCalled();
  search.update("missing");
  await vi.runAllTimersAsync();
  expect(show).toHaveBeenLastCalledWith({ kind: "empty" });
});
it("reports HTTP failure and retries the latest trimmed query", async () => {
  vi.useFakeTimers();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 500 }))
    .mockResolvedValueOnce(Response.json([{ name: "Spain" }]));
  vi.stubGlobal("fetch", fetchMock);
  const show = vi.fn();
  const search = createSearch(show);
  search.update(" spain ");
  await vi.runAllTimersAsync();
  expect(show).toHaveBeenLastCalledWith({
    kind: "error",
    message: expect.stringContaining("500"),
  });
  await search.retry();
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(
    Array(2).fill("https://countries.dev/name/spain"),
  );
  expect(show).toHaveBeenLastCalledWith(
    expect.objectContaining({ kind: "results" }),
  );
});
it.each([
  ["TimeoutError", "error"],
  ["AbortError", "loading"],
  ["TypeError", "error"],
])("handles %s as %s", async (name, kind) => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new DOMException("request ended", name)),
  );
  const show = vi.fn();
  createSearch(show).update("spain");
  await vi.runAllTimersAsync();
  expect(show).toHaveBeenLastCalledWith(expect.objectContaining({ kind }));
});
