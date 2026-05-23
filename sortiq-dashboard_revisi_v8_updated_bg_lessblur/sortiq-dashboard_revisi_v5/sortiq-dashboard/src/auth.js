import { getStorage, removeStorage, setStorage } from "./storage.js";

const SESSION_KEY = "sortiq_admin_session_v2";

export function createAuth({ users, sessionTtlMinutes }) {
  function nowMs() {
    return Date.now();
  }

  function setSession(user) {
    const session = {
      username: user.username,
      role: user.role,
      exp: nowMs() + sessionTtlMinutes * 60 * 1000,
    };
    setStorage(SESSION_KEY, session);
    return session;
  }

  function getSession() {
    const s = getStorage(SESSION_KEY);
    if (!s?.exp || nowMs() > s.exp) {
      removeStorage(SESSION_KEY);
      return null;
    }
    return s;
  }

  function isAuthenticated() {
    return !!getSession();
  }

  function login(username, password) {
    const u = users.find((x) => x.username === username && x.password === password);
    if (!u) return false;
    setSession(u);
    return true;
  }

  function logout() {
    removeStorage(SESSION_KEY);
  }

  return { login, logout, getSession, isAuthenticated };
}

