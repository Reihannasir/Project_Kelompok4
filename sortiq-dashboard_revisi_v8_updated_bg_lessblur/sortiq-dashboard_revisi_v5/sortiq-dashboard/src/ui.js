import { fmt, fmt0, nowStr, toTitle } from "./utils.js";
import { badgeKindForStatus, formatAlertMeta } from "./alerts.js";

export const VIEW_META = {
  home: {
    title: "Beranda",
    subtitle: "Pilih fitur untuk menampilkan tampilan lengkap dashboard",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Monitoring real-time pemilahan limbah (organik, logam, tekstil)",
  },
  riwayat: {
    title: "Riwayat",
    subtitle: "Historical data untuk analisis dan pengambilan keputusan manajemen",
  },
  pengaturan: {
    title: "Pengaturan",
    subtitle: "Atur ambang kapasitas, ambang gas, dan target harian",
  },
};

export function setView(el, view) {
  el.navItems.forEach((b) => b.classList.toggle("is-active", b.dataset.view === view));
  el.views.forEach((v) => v.classList.toggle("is-active", v.dataset.view === view));
  el.pageTitle.textContent = VIEW_META[view]?.title || "Dashboard";
  el.pageSubtitle.textContent = VIEW_META[view]?.subtitle || "";

  // Sembunyikan navigasi lengkap saat Beranda (biar sederhana)
  if (el.appNav) el.appNav.style.display = view === "home" ? "none" : "flex";

  // Tombol export hanya relevan di dashboard/riwayat
  if (el.btnExport) el.btnExport.style.display = view === "dashboard" || view === "riwayat" ? "inline-flex" : "none";

  // Biar tidak terasa "berantakan": setiap pindah menu, balikin scroll ke atas
  // (terutama setelah klik tile di Beranda yang kadang membuat halaman scroll)
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function renderConn(el, state) {
  const stateStr = state.mqttOnline ? "ok" : "down";
  el.connBadge.dataset.state = stateStr;
  el.connBadge.textContent = `MQTT: ${state.mqttOnline ? "Online" : "Offline"}`;
  el.lastUpdate.textContent = state.lastUpdate ? nowStr(state.lastUpdate) : "—";
}

export function renderKpis(el, state, config) {
  el.kpiTotalKg.textContent = fmt.format(state.totalsToday.kg);
  el.kpiTotalEvents.textContent = fmt0.format(state.totalsToday.events);

  const attention = Object.values(state.bins).filter((b) => b.status !== "kosong").length;
  el.kpiBinsAttention.textContent = fmt0.format(attention);

  const activeAlerts = state.alerts.filter((a) => !a.ack).length;
  el.kpiAlerts.textContent = fmt0.format(activeAlerts);

  if (el.dailyTargetLabel && config?.targets?.dailyKgTarget != null) {
    el.dailyTargetLabel.textContent = fmt0.format(config.targets.dailyKgTarget);
  }
}

export function renderBins(el, state) {
  const html = Object.entries(state.bins)
    .map(([catKey, b]) => {
      const label = state.categoriesByKey[catKey]?.label || catKey;
      const kind = badgeKindForStatus(b.status);
      return `
        <div class="bin" role="group" aria-label="Tempat sampah ${label}">
          <div class="bin__top">
            <div class="bin__name">${label}</div>
            <div class="badge" data-kind="${kind}">${toTitle(b.status)}</div>
          </div>
          <div class="progress" aria-label="Kapasitas ${fmt0.format(b.capacity)}%">
            <div class="progress__bar" style="width:${Math.max(0, Math.min(100, b.capacity))}%"></div>
          </div>
          <div class="bin__meta">
            <span>Kapasitas</span>
            <span>${fmt0.format(b.capacity)}%</span>
          </div>
        </div>
      `;
    })
    .join("");
  el.binsContainer.innerHTML = html;
}

export function renderAlerts(el, state) {
  const active = state.alerts.filter((a) => !a.ack);
  el.alertsEmpty.style.display = active.length ? "none" : "block";

  el.alertsContainer.querySelectorAll(".alert").forEach((n) => n.remove());
  for (const a of active) {
    const div = document.createElement("div");
    div.className = "alert";
    div.innerHTML = `
      <div>
        <div class="alert__title">${a.title}</div>
        <div class="alert__desc">${a.desc}</div>
        <div class="alert__meta">${formatAlertMeta(a)}</div>
      </div>
      <div class="alert__actions">
        <button class="btn btn--ghost" data-ack="${a.id}" type="button">Tandai</button>
      </div>
    `;
    el.alertsContainer.appendChild(div);
  }
}

export function renderEvents(el, state, config) {
  const max = config.limits.maxEventsTable;
  const rows = state.events.slice(0, max).map((e) => {
    const tag = e.jenis_sampah;
    const label = state.categoriesByKey[e.jenis_sampah]?.label || e.jenis_sampah;
    return `
      <tr>
        <td>${e.timestamp}</td>
        <td><span class="tag" data-kind="${tag}">${label}</span></td>
        <td>${fmt.format(e.berat_sampah)}</td>
        <td>${fmt0.format(e.kapasitas_tempat)}</td>
        <td>${toTitle(e.status_tempat)}</td>
        <td>${e.gas_ppm == null ? "—" : fmt0.format(e.gas_ppm)}</td>
      </tr>
    `;
  });
  el.eventsTbody.innerHTML = rows.join("");
}

export function renderAll(el, state, config) {
  renderConn(el, state);
  renderKpis(el, state, config);
  renderBins(el, state);
  renderAlerts(el, state);
  renderEvents(el, state, config);
}
