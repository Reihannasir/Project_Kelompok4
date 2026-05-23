import { loadJson } from "./jsonLoader.js";
import { createAuth } from "./auth.js";
import { collectDom } from "./dom.js";
import { createInitialState } from "./state.js";
import { seedHistory } from "./history.js";
import { initCharts } from "./charts.js";
import { createDashboard } from "./dashboard.js";
import { applyPreferencesToConfig, loadPreferences } from "./preferences.js";
import { applyTheme, getTheme, syncThemeButton, toggleTheme } from "./theme.js";
import { loadUsersOverride } from "./usersStore.js";

// Fallback (agar tetap jalan kalau JSON tidak bisa di-fetch, mis. file://)
const FALLBACK_CONFIG = {
  app: { name: "SortIQ", subtitle: "Farselion Hotel", sessionTtlMinutes: 480 },
  limits: { maxEventsTable: 20, maxEventsMemory: 60, maxAlertsMemory: 12 },
  categories: [
    { key: "organik", label: "Organik", color: "rgba(34,197,94,1)" },
    { key: "logam", label: "Logam", color: "rgba(100,116,139,1)" },
    { key: "tekstil", label: "Tekstil", color: "rgba(122,30,58,1)" },
  ],
  thresholds: { capacity: { almostFullPct: 60, fullPct: 85 }, gasPpm: { enabled: true, threshold: 320 } },
  targets: { dailyKgTarget: 100 },
};

const FALLBACK_USERS = [{ username: "admin", password: "admin123", role: "admin" }];

async function bootstrap() {
  const el = collectDom();

  const [config, usersFromFile] = await Promise.all([
    loadJson("./data/config.json", FALLBACK_CONFIG),
    loadJson("./data/users.json", FALLBACK_USERS),
  ]);

  // Users override (prototype): jika user pernah ganti username/password dari Pengaturan,
  // simpanannya ada di localStorage dan dipakai sebagai prioritas.
  let users = usersFromFile;
  const override = loadUsersOverride();
  if (override) users = override;

  // Terapkan preferensi lokal (tanpa backend)
  applyPreferencesToConfig(config, loadPreferences());

  // Tema (siang/malam)
  applyTheme(getTheme());

  // Toggle tema di halaman login (agar user bisa pilih sebelum masuk)
  syncThemeButton(el.btnThemeToggleLogin);
  el.btnThemeToggleLogin?.addEventListener("click", () => {
    toggleTheme();
    syncThemeButton(el.btnThemeToggleLogin);
  });

  const auth = createAuth({ users, sessionTtlMinutes: config.app.sessionTtlMinutes });
  const state = createInitialState({ config });
  seedHistory(state, 30);

  // Inisialisasi charts dengan fallback (lihat src/charts.js)
  const charts = initCharts({ config, state });
  const dashboard = createDashboard({ el, state, config, charts, auth, users });

  function showLogin() {
    if (el.errBox) el.errBox.style.display = "none";
    el.loginView.style.display = "grid";
    el.dashboardView.style.display = "none";
  }

  function showDashboard() {
    el.loginView.style.display = "none";
    el.dashboardView.style.display = "grid";
    dashboard.start();
  }

  function syncAuthUI() {
    if (auth.isAuthenticated()) showDashboard();
    else showLogin();
  }

  // login handler
  el.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (el.errBox) el.errBox.style.display = "none";
    const username = el.loginUsername.value.trim();
    const password = el.loginPassword.value;
    const ok = auth.login(username, password);
    if (!ok) {
      el.errBox.textContent = "Username atau password salah.";
      el.errBox.style.display = "block";
      return;
    }
    syncAuthUI();
  });

  // logout handler
  el.btnLogout?.addEventListener("click", () => {
    auth.logout();
    syncAuthUI();
  });

  // initial
  syncAuthUI();
}

bootstrap();
