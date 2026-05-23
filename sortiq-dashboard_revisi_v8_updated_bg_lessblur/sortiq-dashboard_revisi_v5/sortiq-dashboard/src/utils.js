export const fmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export const fmt0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function nowStr(d = new Date()) {
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function toTitle(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

