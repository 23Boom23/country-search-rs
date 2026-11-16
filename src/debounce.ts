export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => clearTimeout(timer);

  const run = (...args: Args) => {
    cancel();
    timer = setTimeout(() => fn(...args), delay);
  };

  return Object.assign(run, { cancel });
}
