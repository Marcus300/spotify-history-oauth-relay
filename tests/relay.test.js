const test = require("node:test");
const assert = require("node:assert/strict");
const relay = require("../callback/relay.js");

function enc(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function stateFor(origin, nonce="nonce123") {
  return "v1." + enc(origin) + "." + nonce;
}

test("accepts private IPv4 destinations", () => {
  for (const origin of [
    "http://192.168.1.50:8788",
    "http://10.0.0.20:8788",
    "http://172.16.4.20:8788",
    "http://127.0.0.1:8788",
    "http://169.254.10.2:8788"
  ]) {
    assert.equal(relay.isLocalOrigin(origin), true, origin);
  }
});

test("accepts .local and local IPv6 destinations", () => {
  for (const origin of [
    "http://umbrel.local:8788",
    "https://server.local",
    "http://[::1]:8788",
    "http://[fd00::1]:8788",
    "http://[fe80::1]:8788"
  ]) {
    assert.equal(relay.isLocalOrigin(origin), true, origin);
  }
});

test("rejects public or unsafe destinations", () => {
  for (const origin of [
    "https://example.com",
    "http://8.8.8.8:8788",
    "javascript:alert(1)",
    "http://user:pass@umbrel.local:8788",
    "http://umbrel.local:8788/setup",
    "http://umbrel.local:8788/?x=1",
    "http://umbrel.local:8788/#frag"
  ]) {
    assert.equal(relay.isLocalOrigin(origin), false, origin);
  }
});

test("rejects missing, invalid-version and invalid-base64 states", () => {
  assert.throws(() => relay.parseState(""), /missing state/);
  assert.throws(() => relay.parseState("v2."+enc("http://umbrel.local:8788")+".n"), /unsupported state/);
  assert.throws(() => relay.parseState("v1.***.n"), /base64url/);
});

test("rejects state whose decoded destination is public", () => {
  assert.throws(
    () => relay.parseState(stateFor("https://example.com")),
    /non-local origin/
  );
});

test("builds only the local auth callback and forwards approved OAuth keys", () => {
  const state=stateFor("http://192.168.1.50:8788");
  const target=new URL(relay.buildTarget(
    "?code=abc&state="+encodeURIComponent(state)+"&ignored=secret"
  ));
  assert.equal(target.origin, "http://192.168.1.50:8788");
  assert.equal(target.pathname, "/auth/callback");
  assert.equal(target.searchParams.get("code"), "abc");
  assert.equal(target.searchParams.get("state"), state);
  assert.equal(target.searchParams.has("ignored"), false);
});

test("forwards Spotify error without accepting extra parameters", () => {
  const state=stateFor("http://umbrel.local:8788");
  const target=new URL(relay.buildTarget(
    "?error=access_denied&error_description=nope&state="+encodeURIComponent(state)+"&token=bad"
  ));
  assert.equal(target.pathname, "/auth/callback");
  assert.equal(target.searchParams.get("error"), "access_denied");
  assert.equal(target.searchParams.get("error_description"), "nope");
  assert.equal(target.searchParams.has("token"), false);
});

test("rejects duplicate security-sensitive query parameters", () => {
  const state=stateFor("http://umbrel.local:8788");
  assert.throws(
    () => relay.buildTarget("?state="+encodeURIComponent(state)+"&state="+encodeURIComponent(state)),
    /duplicate state/
  );
  assert.throws(
    () => relay.buildTarget("?state="+encodeURIComponent(state)+"&code=a&code=b"),
    /duplicate code/
  );
});
