import { createSearch, type SearchState } from "./search.js";
import type { Country } from "./country.js";

function element<Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  className = "",
  text = "",
) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

const formatNumber = new Intl.NumberFormat("en");
const names = new Intl.DisplayNames(["en"], {
  type: "region",
  fallback: "code",
});
const format = (value: number | null) =>
  value === null ? "—" : formatNumber.format(value);
const list = (values: string[], fallback = "—") =>
  values.length ? values.join(", ") : fallback;
const borders = (values: string[]) =>
  list(
    values.map((code) =>
      /^[A-Z]{2}$/.test(code) ? (names.of(code) ?? code) : code,
    ),
    "No land borders listed",
  );

function facts(entries: [string, string][]) {
  const group = element("dl", "facts");
  for (const [name, value] of entries) {
    const item = element("div");
    item.append(element("dt", "", name), element("dd", "", value));
    group.append(item);
  }
  return group;
}

function flag(country: Country) {
  if (!country.flag) return element("span", "flag flag-missing", "—");
  if (!/^https?:\/\//.test(country.flag))
    return element("span", "flag flag-missing", country.flag);
  const img = element("img", "flag");
  img.src = country.flag;
  img.alt = "";
  return img;
}

const nav = element("header", "masthead");
const home = element("a", "wordmark", "◈  Field Atlas");
home.href = "./";
nav.append(home, element("span", "masthead-label", "COUNTRY DIRECTORY"));

const hero = element("section", "hero");
const intro = element("div", "hero-copy");
intro.append(
  element("h1", "", "Country search"),
  element("p", "", "Find countries and territories by name."),
);
hero.append(intro);

const label = element("label", "search-label", "Country name");
label.htmlFor = "country-name";
const input = element("input");
input.id = label.htmlFor;
input.type = "search";
input.placeholder = "e.g. Iceland";
input.autocomplete = "off";
input.spellcheck = false;

const field = element("div", "search-field");
const magnifier = element("span", "magnifier");
magnifier.ariaHidden = "true";
field.append(magnifier, input);
const searchBox = element("section", "search-box");
searchBox.append(label, field);

const output = element("section", "results");
const status = element("p", "status");
status.setAttribute("role", "status");
const grid = element("ul", "results-grid");

const retry = element("button", "action", "Try again");
retry.type = "button";
retry.hidden = true;
output.append(status, retry, grid);

const detail = element("dialog", "detail");
detail.setAttribute("aria-labelledby", "country-title");
const detailBody = element("div", "detail-body");

const close = element("button", "action close", "Close");
close.type = "button";
close.addEventListener("click", () => detail.close());

// Only clicks on the backdrop dismiss the dialog.
detail.addEventListener("click", (event) => {
  if (event.target === detail) detail.close();
});
detail.append(close, detailBody);

function showCountry(country: Country) {
  const title = element("h2", "", country.name);
  title.id = "country-title";
  const overview = [
    country.capital === "—" ? "" : `Capital: ${country.capital}.`,
    country.region === "—" ? "" : `Region: ${country.region}.`,
  ]
    .filter(Boolean)
    .join(" ");
  detailBody.replaceChildren(
    flag(country),
    title,
    element(
      "p",
      "",
      country.description || overview || "No description available.",
    ),
    facts([
      ["Area", country.area === null ? "—" : `${format(country.area)} km²`],
      ["Population", format(country.population)],
      ["Borders", borders(country.borders)],
      ["Languages", list(country.languages)],
      ["Currencies", list(country.currencies)],
    ]),
  );
  detail.showModal();
}

function card(country: Country) {
  const item = element("li", "country");
  const title = element("h2", "", country.name);
  const button = element("button", "country-link", "View country");
  button.setAttribute("aria-label", `View ${country.name}`);
  button.type = "button";
  button.addEventListener("click", () => showCountry(country));
  const identity = element("div", "identity");
  identity.append(flag(country), title);
  item.append(
    identity,
    facts([
      ["Capital", country.capital],
      ["Region", country.region],
      ["Population", format(country.population)],
    ]),
    button,
  );
  return item;
}

function render(state: SearchState) {
  grid.replaceChildren();
  status.dataset.state = state.kind;
  retry.hidden = state.kind !== "error";
  output.setAttribute("aria-busy", String(state.kind === "loading"));

  switch (state.kind) {
    case "idle":
      status.textContent = "";
      break;
    case "loading":
      status.textContent = "Searching countries…";
      break;
    case "empty":
      status.textContent =
        "No countries found. Try a different spelling or a shorter name.";
      break;
    case "error":
      status.textContent = state.message;
      break;
    case "results":
      status.textContent = `${state.countries.length} ${state.countries.length === 1 ? "country" : "countries"} found`;
      grid.append(...state.countries.map(card));
      break;
  }
}

const search = createSearch(render);
input.addEventListener("input", () => search.update(input.value));
retry.addEventListener("click", () => void search.retry());

const main = element("main", "page");
main.append(hero, searchBox, output);
document.body.append(nav, main, detail);
