import { HttpError, searchCountries } from "./api.js";
import { mapCountryResponse, type Country } from "./country.js";
import { debounce } from "./debounce.js";

export type SearchState =
  | { kind: "idle" | "loading" | "empty" }
  | { kind: "error"; message: string }
  | { kind: "results"; countries: Country[] };

const SEARCH_DELAY = 300;
const REQUEST_TIMEOUT = 8000;

export function createSearch(show: (state: SearchState) => void) {
  let latestQuery = "";
  let active: AbortController | undefined;

  async function run(query: string) {
    const controller = new AbortController();
    active = controller;
    // Combine input cancellation with the request deadline.
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(REQUEST_TIMEOUT),
    ]);

    show({ kind: "loading" });

    try {
      const raw = await searchCountries(query, signal);
      signal.throwIfAborted();

      show(
        raw.length
          ? { kind: "results", countries: raw.map(mapCountryResponse) }
          : { kind: "empty" },
      );
    } catch (error) {
      // User cancellations stay silent.
      if (
        controller.signal.aborted ||
        (error instanceof Error && error.name === "AbortError")
      )
        return;

      let message = "Could not reach the country service.";
      if (error instanceof Error && error.name === "TimeoutError")
        message = "The country service took too long to respond.";
      else if (error instanceof HttpError)
        message = `The country service returned HTTP ${error.status}.`;

      show({ kind: "error", message });
    } finally {
      if (active === controller) active = undefined;
    }
  }

  const schedule = debounce(run, SEARCH_DELAY);

  function stop() {
    active?.abort();
    schedule.cancel();
  }

  return {
    update(value: string) {
      // Abort before waiting for the next debounce.
      stop();
      latestQuery = value.trim();
      show({ kind: "idle" });

      if (latestQuery) schedule(latestQuery);
    },
    async retry() {
      stop();
      if (latestQuery) await run(latestQuery);
    },
  };
}
