// Chart.js harus tersedia global (dibaca dari CDN di index.html)
import { fmt } from "./utils.js";

export function initCharts({ config, state }) {
  const Chart = window.Chart;
  // Jangan sampai halaman blank kalau CDN Chart.js gagal load (mis. internet terbatas).
  // Dashboard tetap bisa jalan, hanya grafik yang tidak tampil/update.
  if (!Chart) {
    console.warn("[SortIQ] Chart.js tidak tersedia. Grafik dinonaktifkan.");
    return {
      updateCharts: () => {},
      updateHistoryChart: () => {},
    };
  }

  const labels = config.categories.map((c) => c.label);
  const colors = config.categories.map((c) => c.color);

  function cssVar(name, fallback = "") {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch {
      return fallback;
    }
  }

  function themeColors() {
    const brandRgb = cssVar("--brand-rgb", "195, 90, 119");
    return {
      text: cssVar("--text", "rgba(255,255,255,.92)"),
      muted: cssVar("--muted", "rgba(255,255,255,.65)"),
      grid: cssVar("--border-2", "rgba(255,255,255,.08)"),
      brand: cssVar("--brand", "rgba(195,90,119,1)"),
      brandRgb,
      brandFill: `rgba(${brandRgb}, .15)`,
    };
  }

  const chartByCategory = new Chart(document.getElementById("chartByCategory"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Kg",
          data: labels.map(() => 0),
          backgroundColor: colors.map((c) => c.replace(",1)", ",.65)")),
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${fmt.format(ctx.parsed.y)} kg` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: themeColors().muted } },
        y: { ticks: { color: themeColors().muted }, grid: { color: themeColors().grid } },
      },
    },
  });

  const chart7d = new Chart(document.getElementById("chart7d"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Total Kg", data: [] }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: themeColors().muted }, grid: { display: false } },
        y: { ticks: { color: themeColors().muted }, grid: { color: themeColors().grid } },
      },
    },
  });

  const chartHistory = new Chart(document.getElementById("chartHistory"), {
    type: "line",
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: themeColors().text } } },
      scales: {
        x: { ticks: { color: themeColors().muted }, grid: { display: false } },
        y: { ticks: { color: themeColors().muted }, grid: { color: themeColors().grid } },
      },
    },
  });

  function syncTheme() {
    const c = themeColors();
    const applyAxes = (chart) => {
      if (!chart?.options?.scales) return;
      if (chart.options.scales.x?.ticks) chart.options.scales.x.ticks.color = c.muted;
      if (chart.options.scales.y?.ticks) chart.options.scales.y.ticks.color = c.muted;
      if (chart.options.scales.y?.grid) chart.options.scales.y.grid.color = c.grid;
    };
    applyAxes(chartByCategory);
    applyAxes(chart7d);
    applyAxes(chartHistory);
    if (chartHistory?.options?.plugins?.legend?.labels) chartHistory.options.plugins.legend.labels.color = c.text;

    chart7d.data.datasets[0].borderColor = c.brand;
    chart7d.data.datasets[0].backgroundColor = c.brandFill;

    chartByCategory.update();
    chart7d.update();
    chartHistory.update();
  }

  function updateCharts({ last7Labels, last7Values }) {
    chartByCategory.data.datasets[0].data = config.categories.map((c) => state.totalsToday.byCategoryKg[c.key] || 0);
    chartByCategory.update();

    chart7d.data.labels = last7Labels;
    chart7d.data.datasets[0].data = last7Values;
    const c = themeColors();
    chart7d.data.datasets[0].borderColor = c.brand;
    chart7d.data.datasets[0].backgroundColor = c.brandFill;
    chart7d.data.datasets[0].borderWidth = 2;
    chart7d.data.datasets[0].tension = 0.35;
    chart7d.data.datasets[0].fill = true;
    chart7d.data.datasets[0].pointRadius = 3;
    chart7d.update();
  }

  function updateHistoryChart({ labels, datasets }) {
    chartHistory.data.labels = labels;
    chartHistory.data.datasets = datasets;
    chartHistory.update();
  }

  // initial theme sync
  syncTheme();

  return { updateCharts, updateHistoryChart, syncTheme };
}
