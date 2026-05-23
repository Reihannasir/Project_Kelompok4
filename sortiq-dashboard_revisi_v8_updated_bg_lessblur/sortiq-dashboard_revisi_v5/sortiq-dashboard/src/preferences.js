import { getStorage, setStorage, removeStorage } from "./storage.js";

const PREFS_KEY = "sortiq_prefs";

export function loadPreferences() {
  return getStorage(PREFS_KEY) || {};
}

export function savePreferences(prefs) {
  setStorage(PREFS_KEY, prefs);
}

export function resetPreferences() {
  removeStorage(PREFS_KEY);
}

export function applyPreferencesToConfig(config, prefs) {
  if (!prefs || typeof prefs !== "object") return config;

  // thresholds.capacity
  if (prefs.thresholds?.capacity) {
    config.thresholds = config.thresholds || {};
    config.thresholds.capacity = config.thresholds.capacity || {};
    const a = Number(prefs.thresholds.capacity.almostFullPct);
    const f = Number(prefs.thresholds.capacity.fullPct);
    if (Number.isFinite(a)) config.thresholds.capacity.almostFullPct = a;
    if (Number.isFinite(f)) config.thresholds.capacity.fullPct = f;
  }

  // thresholds.gasPpm
  if (prefs.thresholds?.gasPpm) {
    config.thresholds = config.thresholds || {};
    config.thresholds.gasPpm = config.thresholds.gasPpm || {};
    if (typeof prefs.thresholds.gasPpm.enabled === "boolean") {
      config.thresholds.gasPpm.enabled = prefs.thresholds.gasPpm.enabled;
    }
    const g = Number(prefs.thresholds.gasPpm.threshold);
    if (Number.isFinite(g)) config.thresholds.gasPpm.threshold = g;
  }

  // targets
  if (prefs.targets) {
    config.targets = config.targets || {};
    const d = Number(prefs.targets.dailyKgTarget);
    if (Number.isFinite(d)) config.targets.dailyKgTarget = d;
  }

  // limits
  if (prefs.limits) {
    config.limits = config.limits || {};
    const m = Number(prefs.limits.maxEventsTable);
    if (Number.isFinite(m)) config.limits.maxEventsTable = m;
  }

  return config;
}

