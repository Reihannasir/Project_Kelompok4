# SortIQ — Prototype Dashboard (Web)

Prototype ini dibuat berdasarkan deskripsi di proposal **SortIQ: Smart Waste Sorting System berbasis IoT** untuk Farselion Hotel, terutama kebutuhan dashboard:

- **Monitoring real-time**
- **Historical data**
- **Grafik jumlah sampah**
- **Status tempat sampah (kapasitas)**
- **Alert system**

## Cara membuka

> Penting: karena versi ini memakai **file JSON** (`/data/*.json`) dan **ES Modules** (`/src/*.js`), sebaiknya dijalankan lewat server (mis. **VS Code Live Server**), bukan sekadar double click `index.html`.

1. Buka folder `sortiq-dashboard` di VS Code.
2. Install extension **Live Server** (Ritwick Dey).
3. Klik kanan `index.html` → **Open with Live Server**.
2. Login admin (kredensial demo):
   - **username:** `admin`
   - **password:** `admin123`
3. Setelah login, dashboard akan tampil di halaman yang sama.
4. Dashboard akan berjalan **tanpa backend** karena memakai **data simulasi**.

> Catatan: login ini hanya untuk **prototype** (front-end). Untuk implementasi nyata, login sebaiknya divalidasi lewat backend.

## Field data (sesuai proposal)

Contoh payload event (format **JSON**) yang ditampilkan pada tabel real-time:

- `jenis_sampah` (organik/logam/tekstil)
- `berat_sampah` (kg)
- `kapasitas_tempat` (%)
- `status_tempat` (kosong/hampir penuh/penuh)
- `gas_ppm` (opsional untuk organik)

## Catatan implementasi nyata (ringkas)

Pada implementasi server yang disebut di proposal:

- ESP32 publish data ke **MQTT broker (Mosquitto)**
- Backend **Node.js** subscribe MQTT, simpan historis ke **MySQL**
- Dashboard mengambil data real-time via **WebSocket** atau **Server-Sent Events**, dan historis via **HTTP API**

## Struktur modular

- `data/config.json` → konfigurasi (kategori, threshold, limit, target)
- `data/users.json` → user admin demo (prototype)
- `src/main.js` → entrypoint
- `src/auth.js` → autentikasi (prototype)
- `src/state.js` → state & helper status
- `src/simulator.js` → simulasi event (payload JSON)
- `src/ui.js` + `src/historyUi.js` → render UI
- `src/charts.js` → Chart.js wrapper
