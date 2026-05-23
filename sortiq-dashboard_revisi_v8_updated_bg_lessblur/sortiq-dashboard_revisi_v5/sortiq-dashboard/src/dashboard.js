import { todayKey, downloadText, nowStr } from "./utils.js";
import { ackAllAlerts, ackOneAlert } from "./alerts.js";
import { resetBins, simulateEvent } from "./simulator.js";
import { renderAll, setView } from "./ui.js";
import { applyHistoryFilter } from "./historyUi.js";
import { deriveStatusFromCapacity } from "./state.js";
import { loadPreferences, resetPreferences, savePreferences } from "./preferences.js";
import { applyTheme, getTheme, syncThemeButton, toggleTheme } from "./theme.js";
import { clearUsersOverride, saveUsersOverride } from "./usersStore.js";

export function createDashboard({ el, state, config, charts, auth, users }) {
  let started = false;

  function exportCsv() {
    const header = [
      "timestamp",
      "jenis_sampah",
      "berat_sampah",
      "kapasitas_tempat",
      "status_tempat",
      "gas_ppm",
    ];
    const rows = state.events.slice(0, 200).map((e) =>
      [
        e.timestamp,
        e.jenis_sampah,
        e.berat_sampah,
        e.kapasitas_tempat,
        e.status_tempat,
        e.gas_ppm == null ? "" : e.gas_ppm,
      ]
        .map((x) => `"${String(x).replaceAll('"', '""')}"`)
        .join(",")
    );
    const content = [header.join(","), ...rows].join("\n");
    downloadText(`sortiq_events_${todayKey()}.csv`, content);
  }

  function tickClock() {
    el.clock.textContent = nowStr();
  }

  function updateChartsFromHistory() {
    const last7 = state.historyDaily.slice(-7).map((row) => {
      const [, m, d] = row.date.split("-");
      return {
        label: `${d}/${m}`,
        totalKg: row.byCategoryKg.organik + row.byCategoryKg.logam + row.byCategoryKg.tekstil,
      };
    });
    charts.updateCharts({
      last7Labels: last7.map((x) => x.label),
      last7Values: last7.map((x) => x.totalKg),
    });
  }

  function render() {
    renderAll(el, state, config);
    updateChartsFromHistory();
  }

  function start() {
    if (started) return;
    started = true;

    render();
    tickClock();

    // clock
    setInterval(tickClock, 1000);

    // theme toggle (topbar)
    syncThemeButton(el.btnThemeToggle);
    el.btnThemeToggle?.addEventListener("click", () => {
      toggleTheme();
      syncThemeButton(el.btnThemeToggle);
      // sinkron label tombol tema di halaman login (jika user logout)
      syncThemeButton(el.btnThemeToggleLogin);
      charts?.syncTheme?.();
      // sinkronkan radio di halaman pengaturan (kalau sedang dibuka)
      const t = getTheme();
      if (el.themeDay) el.themeDay.checked = t === "day";
      if (el.themeNight) el.themeNight.checked = t === "night";
    });

    // settings form (pengaturan)
    function initSettingsForm() {
      if (!el.settingsForm) return;

      if (el.capAlmost) el.capAlmost.value = String(config.thresholds?.capacity?.almostFullPct ?? 60);
      if (el.capFull) el.capFull.value = String(config.thresholds?.capacity?.fullPct ?? 85);
      if (el.gasEnabled) el.gasEnabled.checked = !!config.thresholds?.gasPpm?.enabled;
      if (el.gasThreshold) el.gasThreshold.value = String(config.thresholds?.gasPpm?.threshold ?? 320);
      if (el.dailyTarget) el.dailyTarget.value = String(config.targets?.dailyKgTarget ?? 100);
      if (el.maxEventsTable) el.maxEventsTable.value = String(config.limits?.maxEventsTable ?? 20);

      // simpan
      el.settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const almost = Number(el.capAlmost?.value);
        const full = Number(el.capFull?.value);
        const gasTh = Number(el.gasThreshold?.value);
        const daily = Number(el.dailyTarget?.value);
        const maxTable = Number(el.maxEventsTable?.value);

        // validasi ringan (tanpa bikin UI ribet)
        if (!(Number.isFinite(almost) && Number.isFinite(full) && almost >= 0 && full <= 100 && almost < full)) {
          if (el.settingsStatus) el.settingsStatus.textContent = "Ambang kapasitas tidak valid (pastikan hampir penuh < penuh).";
          return;
        }
        if (!(Number.isFinite(gasTh) && gasTh >= 0)) {
          if (el.settingsStatus) el.settingsStatus.textContent = "Ambang gas tidak valid.";
          return;
        }
        if (!(Number.isFinite(daily) && daily >= 0)) {
          if (el.settingsStatus) el.settingsStatus.textContent = "Target harian tidak valid.";
          return;
        }
        if (!(Number.isFinite(maxTable) && maxTable >= 5 && maxTable <= 100)) {
          if (el.settingsStatus) el.settingsStatus.textContent = "Maks baris tabel harus 5–100.";
          return;
        }

        // simpan ke config (runtime)
        config.thresholds = config.thresholds || {};
        config.thresholds.capacity = config.thresholds.capacity || {};
        config.thresholds.capacity.almostFullPct = almost;
        config.thresholds.capacity.fullPct = full;

        config.thresholds.gasPpm = config.thresholds.gasPpm || {};
        config.thresholds.gasPpm.enabled = !!el.gasEnabled?.checked;
        config.thresholds.gasPpm.threshold = gasTh;

        config.targets = config.targets || {};
        config.targets.dailyKgTarget = daily;

        config.limits = config.limits || {};
        config.limits.maxEventsTable = maxTable;

        // recompute status bin sesuai threshold baru
        for (const catKey of Object.keys(state.bins)) {
          state.bins[catKey].status = deriveStatusFromCapacity(state.bins[catKey].capacity, config.thresholds);
        }

        // persist ke localStorage
        savePreferences({
          ...(loadPreferences() || {}),
          thresholds: {
            capacity: { almostFullPct: almost, fullPct: full },
            gasPpm: { enabled: !!el.gasEnabled?.checked, threshold: gasTh },
          },
          targets: { dailyKgTarget: daily },
          limits: { maxEventsTable: maxTable },
        });

        if (el.settingsStatus) el.settingsStatus.textContent = "Tersimpan.";
        setTimeout(() => {
          if (el.settingsStatus) el.settingsStatus.textContent = "";
        }, 1500);

        render();
      });

      // reset
      el.btnSettingsReset?.addEventListener("click", () => {
        resetPreferences();
        try {
          localStorage.removeItem("sortiq_theme");
        } catch {}
        if (el.settingsStatus) el.settingsStatus.textContent = "Di-reset. Memuat ulang...";
        setTimeout(() => location.reload(), 400);
      });
    }

    initSettingsForm();

    // ── Account form (ganti username/password) ──
    function initAccountForm() {
      if (!el.accountForm) return;

      function setStatus(msg) {
        if (!el.accountStatus) return;
        el.accountStatus.textContent = msg || "";
      }

      function syncCurrentUser() {
        const s = auth?.getSession?.();
        if (el.accountCurrentUser) el.accountCurrentUser.value = s?.username || "—";
      }

      syncCurrentUser();

      el.accountForm.addEventListener("submit", (e) => {
        e.preventDefault();
        setStatus("");

        const session = auth?.getSession?.();
        if (!session?.username) {
          setStatus("Sesi tidak ditemukan. Silakan login ulang.");
          return;
        }

        const currentUsername = session.username;
        const user = Array.isArray(users) ? users.find((u) => u.username === currentUsername) : null;
        if (!user) {
          setStatus("User aktif tidak ditemukan. Silakan reset akun.");
          return;
        }

        const currentPass = String(el.accountPasswordCurrent?.value || "");
        if (currentPass !== user.password) {
          setStatus("Password saat ini salah.");
          return;
        }

        const newUsername = String(el.accountUsernameNew?.value || "").trim();
        const newPass = String(el.accountPasswordNew?.value || "");
        const newPass2 = String(el.accountPasswordConfirm?.value || "");

        if (!newUsername && !newPass) {
          setStatus("Tidak ada perubahan.");
          return;
        }

        if (newUsername) {
          const valid = /^[a-zA-Z0-9._-]{3,30}$/.test(newUsername);
          if (!valid) {
            setStatus("Nama user tidak valid (3–30 karakter: huruf/angka/._-).");
            return;
          }
          const exists = users.some((u) => u.username === newUsername && u !== user);
          if (exists) {
            setStatus("Nama user sudah dipakai. Pilih yang lain.");
            return;
          }
        }

        if (newPass) {
          if (newPass.length < 4) {
            setStatus("Password baru minimal 4 karakter.");
            return;
          }
          if (newPass !== newPass2) {
            setStatus("Konfirmasi password baru tidak cocok.");
            return;
          }
        } else if (newPass2) {
          setStatus("Isi password baru, atau kosongkan konfirmasi.");
          return;
        }

        // apply perubahan (mutasi in-place supaya auth tetap pakai referensi yang sama)
        if (newUsername) user.username = newUsername;
        if (newPass) user.password = newPass;

        try {
          saveUsersOverride(users);
        } catch (err) {
          console.error(err);
          setStatus("Gagal menyimpan perubahan.");
          return;
        }

        setStatus("Tersimpan. Memuat ulang dan logout...");
        setTimeout(() => {
          try {
            auth?.logout?.();
          } catch {}
          location.reload();
        }, 500);
      });

      el.btnAccountReset?.addEventListener("click", () => {
        setStatus("Reset akun... memuat ulang.");
        try {
          clearUsersOverride();
          auth?.logout?.();
        } catch {}
        setTimeout(() => location.reload(), 350);
      });
    }

    initAccountForm();

    // ── Real-time (prototype): kapasitas tempat sampah diasumsikan berasal dari sensor ultrasonik.
    // Di versi prototype ini, kita simulasikan telemetri ESP32 (MQTT) via simulator.js.
    setInterval(() => {
      const payload = simulateEvent(state, config);
      if (payload) render();
    }, 1400);

    // nav
    el.navItems.forEach((btn) =>
      btn.addEventListener("click", () => {
        setView(el, btn.dataset.view);
      })
    );

    // quick entry dari Beranda
    el.quickViews?.forEach((btn) =>
      btn.addEventListener("click", () => {
        setView(el, btn.getAttribute("data-quick-view"));
      })
    );

    // actions
    el.btnResetBins.addEventListener("click", () => {
      resetBins(state, config);
      render();
    });
    el.btnAckAll.addEventListener("click", () => {
      ackAllAlerts(state);
      render();
    });
    el.btnPause.addEventListener("click", () => {
      state.paused = !state.paused;
      el.btnPause.textContent = state.paused ? "Resume" : "Pause";
    });
    el.btnExport.addEventListener("click", exportCsv);

    // ack single alert (delegation)
    el.alertsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ack]");
      if (!btn) return;
      ackOneAlert(state, btn.getAttribute("data-ack"));
      render();
    });

    // history
    el.historyForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applyHistoryFilter({ el, state, config, charts });
    });
    applyHistoryFilter({ el, state, config, charts });

    // default view setelah login
    setView(el, "home");
  }

  return { start, render };
}
