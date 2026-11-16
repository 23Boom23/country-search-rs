import { afterEach, expect, it, vi } from "vitest";
import { createSearch } from "../src/search.js";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("aborts the earlier request immediately and keeps the later response", async () => {
  vi.useFakeTimers();
  const finishOrder: string[] = [];
  const canceled: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, { signal }: { signal: AbortSignal }) => {
      const early = url.endsWith("/sp");
      const name = early ? "Singapore" : "Spain";
      return new Promise<Response>((resolve, reject) => {
        setTimeout(
          () => {
            finishOrder.push(name);
            resolve(Response.json([{ name }]));
          },
          early ? 1000 : 30,
        );
        signal.addEventListener(
          "abort",
          () => {
            canceled.push(name);
            reject(new DOMException("Canceled", "AbortError"));
          },
          { once: true },
        );
      });
    }),
  );
  const show = vi.fn();
  const search = createSearch(show);
  search.update("sp");
  await vi.advanceTimersByTimeAsync(300);
  search.update("spain");
  expect(canceled).toEqual(["Singapore"]);
  await vi.runAllTimersAsync();
  expect(finishOrder).toEqual(["Spain", "Singapore"]);
  expect(show).not.toHaveBeenCalledWith(
    expect.objectContaining({ kind: "error" }),
  );
  expect(show).toHaveBeenLastCalledWith({
    kind: "results",
    countries: [expect.objectContaining({ name: "Spain" })],
  });
});
