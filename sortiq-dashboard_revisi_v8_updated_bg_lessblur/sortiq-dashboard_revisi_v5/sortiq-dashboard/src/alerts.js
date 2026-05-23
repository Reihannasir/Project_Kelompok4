import { nowStr } from "./utils.js";

export function badgeKindForStatus(status) {
  if (status === "penuh") return "danger";
  if (status === "hampir penuh") return "warn";
  return "ok";
}

export function createAlert(state, config, { kind, title, desc, meta }) {
  const id = `AL-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const alert = { id, kind, title, desc, meta, createdAt: new Date(), ack: false };
  state.alerts.unshift(alert);
  state.alerts = state.alerts.slice(0, config.limits.maxAlertsMemory);
}

export function ensureBinAlerts(state, config, categoryKey) {
  const b = state.bins[categoryKey];
  if (!b) return;

  const label = state.categoriesByKey[categoryKey]?.label || categoryKey;

  if (b.status === "penuh") {
    createAlert(state, config, {
      kind: "danger",
      title: `Tempat ${label} penuh`,
      desc: `Kapasitas ${Math.round(b.capacity)}% — segera kosongkan.`,
      meta: `Kategori: ${label}`,
    });
  } else if (b.status === "hampir penuh") {
    const exists = state.alerts.some((a) => !a.ack && a.title.includes("hampir penuh") && a.meta.includes(label));
    if (!exists) {
      createAlert(state, config, {
        kind: "warn",
        title: `Tempat ${label} hampir penuh`,
        desc: `Kapasitas ${Math.round(b.capacity)}% — jadwalkan pengosongan.`,
        meta: `Kategori: ${label}`,
      });
    }
  }
}

export function ackAllAlerts(state) {
  for (const a of state.alerts) a.ack = true;
}

export function ackOneAlert(state, id) {
  const a = state.alerts.find((x) => x.id === id);
  if (a) a.ack = true;
}

export function formatAlertMeta(alert) {
  return `${alert.meta} • ${nowStr(alert.createdAt)}`;
}

