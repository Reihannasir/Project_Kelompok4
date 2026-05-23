import { clamp, nowStr, pick, rand } from "./utils.js";
import { deriveStatusFromCapacity } from "./state.js";
import { createAlert, ensureBinAlerts } from "./alerts.js";

export function simulateMqttDrop(state) {
  const dice = Math.random();
  if (dice < 0.04) {
    state.mqttOnline = false;
    setTimeout(() => {
      state.mqttOnline = true;
    }, 1500 + Math.random() * 2500);
  }
}

export function simulateEvent(state, config) {
  if (state.paused) return null;
  simulateMqttDrop(state);
  if (!state.mqttOnline) return null;

  const categories = config.categories.map((c) => c.key);
  const jenis = pick(categories);

  // payload sesuai proposal (JSON)
  const berat = clamp(rand(0.2, 2.4), 0.1, 4);
  const deltaCap = clamp(Math.round(rand(1, 6)), 1, 10);
  const newCap = clamp(state.bins[jenis].capacity + deltaCap, 0, 100);
  const status = deriveStatusFromCapacity(newCap, config.thresholds);

  // gas hanya relevan untuk organik (opsional)
  const gasEnabled = !!config.thresholds.gasPpm?.enabled;
  const gasThreshold = config.thresholds.gasPpm?.threshold ?? 320;
  const gas = gasEnabled && jenis === "organik" && Math.random() < 0.35 ? Math.round(rand(180, 460)) : null;

  const payload = {
    timestamp: nowStr(),
    jenis_sampah: jenis,
    berat_sampah: Number(berat.toFixed(2)),
    kapasitas_tempat: newCap,
    status_tempat: status,
    gas_ppm: gas,
  };

  // update state
  state.lastUpdate = new Date();
  state.events.unshift(payload);
  state.events = state.events.slice(0, config.limits.maxEventsMemory);

  state.bins[jenis].capacity = newCap;
  state.bins[jenis].status = status;

  state.totalsToday.kg += payload.berat_sampah;
  state.totalsToday.events += 1;
  state.totalsToday.byCategoryKg[jenis] += payload.berat_sampah;

  // alert rules
  ensureBinAlerts(state, config, jenis);
  if (gas != null && gas >= gasThreshold) {
    createAlert(state, config, {
      kind: "warn",
      title: "Gas meningkat (organik)",
      desc: `Terukur ${Math.round(gas)} ppm — indikasi bau/busuk.`,
      meta: `Gas: ${Math.round(gas)} ppm`,
    });
  }

  return payload;
}

export function resetBins(state, config) {
  for (const c of config.categories) {
    const k = c.key;
    state.bins[k].capacity = Math.round(rand(5, 28));
    state.bins[k].status = deriveStatusFromCapacity(state.bins[k].capacity, config.thresholds);
  }
  state.alerts = [];
}
