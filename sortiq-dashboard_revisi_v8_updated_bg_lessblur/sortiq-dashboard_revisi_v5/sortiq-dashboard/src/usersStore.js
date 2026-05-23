import { getStorage, removeStorage, setStorage } from "./storage.js";

export const USERS_OVERRIDE_KEY = "sortiq_users_override_v1";

export function loadUsersOverride() {
  const raw = getStorage(USERS_OVERRIDE_KEY);
  if (!Array.isArray(raw)) return null;
  // validasi ringan
  const ok = raw.every((u) => u && typeof u.username === "string" && typeof u.password === "string");
  if (!ok) return null;
  return raw;
}

export function saveUsersOverride(users) {
  if (!Array.isArray(users)) throw new Error("users harus array");
  setStorage(USERS_OVERRIDE_KEY, users);
}

export function clearUsersOverride() {
  removeStorage(USERS_OVERRIDE_KEY);
}

