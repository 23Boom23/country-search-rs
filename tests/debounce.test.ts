import { expect, it, vi, afterEach } from "vitest";
import { debounce } from "../src/debounce.js";
afterEach(() => vi.useRealTimers());
it("runs only the latest call after a full delay and supports cancellation", () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  const run = debounce(callback, 300);
  run("sp");
  vi.advanceTimersByTime(250);
  run("spain");
  vi.advanceTimersByTime(299);
  expect(callback).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledExactlyOnceWith("spain");
  run("france");
  run.cancel();
  vi.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(1);
});
