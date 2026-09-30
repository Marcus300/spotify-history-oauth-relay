(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SpotifyHistoryRelay = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATE_VERSION = "v1";

  function decodeBase64Url(value) {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error("invalid base64url");
    }
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      throw new Error("invalid base64url");
    }
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    if (typeof atob === "function") {
      const bytes = atob(padded);
      return decodeURIComponent(
        Array.prototype.map.call(
          bytes,
          c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")
        ).join("")
      );
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("utf8");
    }
    throw new Error("base64 decoder unavailable");
  }

  function isPrivateIPv4(host) {
    const parts = host.split(".");
    if (parts.length !== 4 || parts.some(p => !/^(0|[1-9]\d{0,2})$/.test(p))) {
      return false;
    }
    const n = parts.map(Number);
    if (n.some(v => v < 0 || v > 255)) return false;
    return n[0] === 10 ||
      n[0] === 127 ||
      (n[0] === 169 && n[1] === 254) ||
      (n[0] === 172 && n[1] >= 16 && n[1] <= 31) ||
      (n[0] === 192 && n[1] === 168);
  }

  function isLocalIPv6(host) {
    const normalized = host.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
    return normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized);
  }

  function isLocalOrigin(originText) {
    let url;
    try {
      url = new URL(originText);
    } catch {
      return false;
    }

    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (url.username || url.password) return false;
    if (url.pathname !== "/" || url.search || url.hash) return false;

    const host = url.hostname.toLowerCase();
    if (host === "umbrel.local" || host.endsWith(".local")) return true;
    if (isPrivateIPv4(host)) return true;
    if (isLocalIPv6(host)) return true;
    return false;
  }

  function parseState(state) {
    if (typeof state !== "string" || !state) {
      throw new Error("missing state");
    }
    const pieces = state.split(".");
    if (pieces.length !== 3 || pieces[0] !== STATE_VERSION) {
      throw new Error("unsupported state");
    }
    const origin = decodeBase64Url(pieces[1]);
    if (!isLocalOrigin(origin)) {
      throw new Error("non-local origin");
    }
    return { origin, nonce: pieces[2], version: pieces[0] };
  }

  function buildTarget(search) {
    const q = new URLSearchParams(search);
    const states = q.getAll("state");
    if (states.length !== 1) {
      throw new Error(states.length === 0 ? "missing state" : "duplicate state");
    }

    const parsed = parseState(states[0]);
    const target = new URL("/auth/callback", parsed.origin);

    for (const key of ["code", "state", "error", "error_description"]) {
      const values = q.getAll(key);
      if (values.length > 1) throw new Error("duplicate " + key);
      if (values.length === 1) target.searchParams.set(key, values[0]);
    }

    return target.toString();
  }

  return {
    STATE_VERSION,
    decodeBase64Url,
    isPrivateIPv4,
    isLocalIPv6,
    isLocalOrigin,
    parseState,
    buildTarget
  };
});
