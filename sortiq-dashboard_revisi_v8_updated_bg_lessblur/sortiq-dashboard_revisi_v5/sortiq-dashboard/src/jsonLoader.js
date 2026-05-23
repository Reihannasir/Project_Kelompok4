// Loader JSON untuk dashboard (butuh dijalankan lewat server seperti VS Code Live Server).
// Ada fallback agar tetap jalan jika fetch gagal.

export async function loadJson(url, fallbackValue) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[SortIQ] Gagal load JSON ${url}. Memakai fallback.`, e);
    return fallbackValue;
  }
}

