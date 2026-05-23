import { getStorage, setStorage } from "./storage.js";

const THEME_KEY = "sortiq_theme";

export function getTheme() {
  const stored = getStorage(THEME_KEY);
  const dom = document.documentElement?.dataset?.theme;
  return stored || dom || "day";
}

export function applyTheme(theme) {
  const next = theme === "night" ? "night" : "day";
  document.documentElement.dataset.theme = next;
  setStorage(THEME_KEY, next);
  return next;
}

export function toggleTheme() {
  const next = getTheme() === "night" ? "day" : "night";
  return applyTheme(next);
}

export function syncThemeButton(btn) {
  if (!btn) return;
  const t = getTheme();
  btn.textContent = t === "night" ? "Mode: Dark" : "Mode: Light";
  btn.setAttribute("aria-label", t === "night" ? "Mode dark aktif" : "Mode light aktif");
}
