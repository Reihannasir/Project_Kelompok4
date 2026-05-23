import { clamp } from "./utils.js";

export function buildCategoryMap(categories) {
  const byKey = {};
  for (const c of categories) byKey[c.key] = c;
  return byKey;
}

export function deriveStatusFromCapacity(capacityPct, thresholds) {
  const full = thresholds.capacity.fullPct;
  const almost = thresholds.capacity.almostFullPct;
  if (capacityPct >= full) return "penuh";
  if (capacityPct >= almost) return "hampir penuh";
  return "kosong";
}

export function createInitialState({ config }) {
  const byCat = buildCategoryMap(config.categories);
  const bins = {};
  for (const c of config.categories) {
    bins[c.key] = { capacity: Math.round(clamp(10 + Math.random() * 20, 0, 100)), status: "kosong" };
    bins[c.key].status = deriveStatusFromCapacity(bins[c.key].capacity, config.thresholds);
  }

  return {
    paused: false,
    mqttOnline: true,
    lastUpdate: null,

    categoriesByKey: byCat,

    bins,

    totalsToday: {
      kg: 0,
      events: 0,
      byCategoryKg: Object.fromEntries(config.categories.map((c) => [c.key, 0])),
    },

    alerts: [],
    events: [],

    historyDaily: [],
  };
}
