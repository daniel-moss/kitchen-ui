// Storybook MANAGER theme (the outer UI: nav sidebar, toolbar, addon panel),
// styled to look like the DS SidebarNav — and following the SAME theme rule
// as the preview: it listens to the preview's `theme` toolbar global
// (auto/light/dark; auto follows the OS live) and swaps the manager theme to
// match. The manager cannot read our CSS tokens, so both palettes are the
// tokens' LIGHT/DARK literals (token named in the comments).
// Finer row styling lives in manager-head.html, keyed off the
// `data-kitchen-theme` attribute this file sets on <html>.
import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming";
import { GLOBALS_UPDATED } from "@storybook/core-events";

const shared = {
  brandTitle: "Kitchen UI",
  fontBase: '"InterVariable", sans-serif',
  fontCode: "ui-monospace, Menlo, monospace",
  appBorderRadius: 6, // border-radius-1_5
  inputBorderRadius: 6,
};

const light = create({
  base: "light",
  ...shared,
  colorPrimary: "#202020", // gray-12
  colorSecondary: "#202020",
  appBg: "#f0f0f0", // surface-level-first (light)
  appContentBg: "#f0f0f0",
  appBorderColor: "#00000026", // gray-a6
  textColor: "#202020", // text-strong
  textMutedColor: "#0000009b", // text-subtle (gray-a11)
  textInverseColor: "#ffffff",
  barBg: "#f0f0f0",
  barTextColor: "#0000009b",
  barHoverColor: "#202020",
  barSelectedColor: "#202020",
  inputBg: "#ffffff",
  inputBorder: "#00000031", // gray-a7
  inputTextColor: "#202020",
});

const dark = create({
  base: "dark",
  ...shared,
  colorPrimary: "#eeeeee", // gray-12 (dark)
  colorSecondary: "#eeeeee",
  appBg: "#2a2a2a", // surface-level-first (dark) = gray-4
  appContentBg: "#2a2a2a",
  appBorderColor: "#ffffff2c", // gray-a6 (dark)
  textColor: "#eeeeee", // text-strong (dark)
  textMutedColor: "#ffffffaf", // text-subtle (dark gray-a11)
  textInverseColor: "#202020",
  barBg: "#2a2a2a",
  barTextColor: "#ffffffaf",
  barHoverColor: "#eeeeee",
  barSelectedColor: "#eeeeee",
  inputBg: "#313131", // gray-5 (dark) — one step above the sidebar
  inputBorder: "#ffffff3b", // gray-a7 (dark)
  inputTextColor: "#eeeeee",
});

const osDark = window.matchMedia("(prefers-color-scheme: dark)");
let globalTheme = "auto";
let managerApi = null;

const apply = () => {
  const resolved = globalTheme === "auto" ? (osDark.matches ? "dark" : "light") : globalTheme;
  document.documentElement.dataset.kitchenTheme = resolved;
  const theme = resolved === "dark" ? dark : light;
  // setOptions (when the api is up) re-renders the UI live; setConfig covers
  // the initial load before register runs.
  if (managerApi) managerApi.setOptions({ theme });
  else addons.setConfig({ theme });
};

apply();
osDark.addEventListener("change", () => {
  if (globalTheme === "auto") apply();
});

addons.register("kitchen-ui/manager-theme", (api) => {
  managerApi = api;
  addons.getChannel().on(GLOBALS_UPDATED, ({ globals }) => {
    if (globals?.theme && globals.theme !== globalTheme) {
      globalTheme = globals.theme;
      apply();
    }
  });
});
