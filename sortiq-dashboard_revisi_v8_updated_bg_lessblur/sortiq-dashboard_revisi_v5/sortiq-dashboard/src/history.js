import { rand } from "./utils.js";

export function seedHistory(state, days = 30) {
  const arr = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
      2,
      "0"
    )}`;

    const organik = rand(10, 35);
    const logam = rand(7, 22);
    const tekstil = rand(4, 12);
    const events = Math.round((organik + logam + tekstil) * rand(1.4, 2.2));

    arr.push({
      date,
      byCategoryKg: { organik, logam, tekstil },
      events,
    });
  }

  state.historyDaily = arr;
}

export function sliceHistory(state, rangeDays) {
  return state.historyDaily.slice(-rangeDays);
}

