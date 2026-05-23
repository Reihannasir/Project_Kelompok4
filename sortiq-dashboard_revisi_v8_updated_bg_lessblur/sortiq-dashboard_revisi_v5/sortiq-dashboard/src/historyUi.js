import { fmt, fmt0 } from "./utils.js";

export function applyHistoryFilter({ el, state, config, charts }) {
  const range = Number(el.historyRange.value || 30);
  const cat = el.historyCategory.value || "all";
  const slice = state.historyDaily.slice(-range);

  let totalKg = 0;
  let totalEvents = 0;
  const rows = [];

  for (const row of slice) {
    const by = row.byCategoryKg;
    const catKg =
      cat === "organik"
        ? by.organik
        : cat === "logam"
          ? by.logam
          : cat === "tekstil"
            ? by.tekstil
            : by.organik + by.logam + by.tekstil;

    totalKg += catKg;
    totalEvents += row.events;

    rows.push({
      date: row.date,
      category: cat === "all" ? "Semua" : state.categoriesByKey[cat]?.label || cat,
      kg: catKg,
      events: row.events,
      note: cat === "all" ? "Akumulasi kategori" : "Akumulasi kategori terpilih",
    });
  }

  el.histTotalKg.textContent = fmt.format(totalKg);
  el.histTotalEvents.textContent = fmt0.format(totalEvents);
  renderHistoryTable(el, rows);
  renderHistoryChart({ state, config, charts, slice, cat });
}

function renderHistoryTable(el, rows) {
  el.historyTbody.innerHTML = rows
    .map(
      (r) => `
      <tr>
        <td>${r.date}</td>
        <td>${r.category}</td>
        <td>${fmt.format(r.kg)}</td>
        <td>${fmt0.format(r.events)}</td>
        <td class="muted">${r.note}</td>
      </tr>
    `
    )
    .join("");
}

function mkSeries(label, data, borderColor, bgColor) {
  return {
    label,
    data,
    borderColor,
    backgroundColor: bgColor,
    borderWidth: 2,
    tension: 0.35,
    fill: true,
    pointRadius: 2.5,
  };
}

function renderHistoryChart({ state, charts, slice, cat }) {
  const labels = slice.map((r) => {
    const [, m, d] = r.date.split("-");
    return `${d}/${m}`;
  });

  const datasets =
    cat === "all"
      ? [
          mkSeries("Organik", slice.map((r) => r.byCategoryKg.organik), "rgba(34,197,94,1)", "rgba(34,197,94,.12)"),
          mkSeries("Logam", slice.map((r) => r.byCategoryKg.logam), "rgba(59,130,246,1)", "rgba(59,130,246,.10)"),
          mkSeries("Tekstil", slice.map((r) => r.byCategoryKg.tekstil), "rgba(124,58,237,1)", "rgba(124,58,237,.10)"),
        ]
      : [
          mkSeries(
            state.categoriesByKey[cat]?.label || cat,
            slice.map((r) => r.byCategoryKg[cat]),
            state.categoriesByKey[cat]?.color || "rgba(255,255,255,.8)",
            "rgba(255,255,255,.10)"
          ),
        ];

  charts.updateHistoryChart({ labels, datasets });
}

