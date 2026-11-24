const DOMAINS = ["chatgpt.com", "openai.com"];
const SESSION_PREFIX = "__Secure-next-auth.session-token";

let switchingUntil = 0;
let captureTimer = null;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function isSwitchingActive() {
  return Date.now() < switchingUntil;
}

function cookieUrl(c) {
  const host = c.domain.startsWith(".") ? c.domain.slice(1) : c.domain;
  return `${c.secure ? "https" : "http"}://${host}${c.path || "/"}`;
}

function sigOf(cookies) {
  const parts = cookies
    .filter((c) => c.name.startsWith(SESSION_PREFIX))
    .map((c) => `${c.name}=${c.value}`)
    .sort();
  if (!parts.length) return "";
  const s = parts.join(";");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

async function allCookies() {
  const map = new Map();
  for (const d of DOMAINS) {
    let list = [];
    try {
      list = await chrome.cookies.getAll({ domain: d });
    } catch (e) {
      console.warn("getAll gagal", d, e);
    }
    for (const c of list) map.set(`${c.domain}|${c.path}|${c.name}`, c);
  }
  return [...map.values()];
}

async function sessionEmail() {
  // Gunakan cache: "no-store" agar tidak mengambil data sesi akun sebelumnya dari cache browser
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch("https://chatgpt.com/api/auth/session", {
        cache: "no-store",
        credentials: "include",
        headers: { accept: "application/json" }
      });
      if (r.ok) {
        const j = await r.json();
        if (j?.user?.email) return j.user.email;
      }
    } catch {}
    if (attempt === 0) await new Promise((res) => setTimeout(res, 800));
  }
  return "";
}

async function hasActiveChatTab() {
  try {
    const tabs = await chrome.tabs.query({
      url: ["https://chatgpt.com/*", "https://*.chatgpt.com/*"]
    });
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        const res = await chrome.tabs.sendMessage(tab.id, { type: "is_chat_ready" });
        if (res && res.ready) return true;
      } catch {
        // Tab belum memiliki content script (misal tab lama sebelum reload ekstensi)
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          });
          const res = await chrome.tabs.sendMessage(tab.id, { type: "is_chat_ready" });
          if (res && res.ready) return true;
        } catch {}
      }
    }
  } catch {}
  return false;
}

async function autoCapture() {
  if (isSwitchingActive()) return;

  // Pastikan user benar-benar sudah berada di halaman chat (chat bar siap & bukan mode logout)
  const isReady = await hasActiveChatTab();
  if (!isReady) return;

  try {
    const cookies = await allCookies();
    const sig = sigOf(cookies);
    if (!cookies.length || !sig) return;

    const email = await sessionEmail();
    if (!email) return;

    const { accounts = [] } = await chrome.storage.local.get("accounts");
    const existing = accounts.find((a) => a.email === email);

    const acc = {
      id: existing?.id || uid(),
      label: existing?.label || email,
      email,
      sig,
      cookies,
      updatedAt: Date.now()
    };

    const next = existing
      ? accounts.map((a) => (a.id === acc.id ? acc : a))
      : [...accounts, acc];

    await chrome.storage.local.set({ accounts: next, currentId: acc.id });
  } catch (err) {
    console.warn("Auto-capture failed:", err);
  }
}

function scheduleAutoCapture(delay = 1000) {
  if (isSwitchingActive()) return;
  if (captureTimer) clearTimeout(captureTimer);
  captureTimer = setTimeout(() => {
    autoCapture();
  }, delay);
}

// Pantau perubahan session-token di background
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (isSwitchingActive()) return;
  const { cookie, removed } = changeInfo;
  if (removed) return;
  if (cookie.name.startsWith(SESSION_PREFIX) && DOMAINS.some((d) => cookie.domain.includes(d))) {
    scheduleAutoCapture(1500);
  }
});

async function capture(label) {
  const cookies = await allCookies();
  if (!cookies.length) throw new Error("Cookie kosong. Buka chatgpt.com dan login dulu.");
  if (!sigOf(cookies)) throw new Error("Sesi login tidak ditemukan. Login dulu, lalu coba lagi.");

  const email = await sessionEmail();
  const { accounts = [] } = await chrome.storage.local.get("accounts");
  const existing = email ? accounts.find((a) => a.email === email) : null;

  const acc = {
    id: existing?.id || uid(),
    label: (label || "").trim() || email || `Akun ${accounts.length + 1}`,
    email: email || existing?.email || "",
    sig: sigOf(cookies),
    cookies,
    updatedAt: Date.now()
  };

  const next = existing
    ? accounts.map((a) => (a.id === acc.id ? acc : a))
    : [...accounts, acc];

  await chrome.storage.local.set({ accounts: next, currentId: acc.id });
  return acc;
}

async function setCookie(c) {
  const details = {
    url: cookieUrl(c),
    name: c.name,
    value: c.value,
    path: c.path || "/",
    secure: c.secure,
    httpOnly: c.httpOnly,
    storeId: c.storeId
  };

  if (c.sameSite && c.sameSite !== "unspecified") details.sameSite = c.sameSite;
  if (!c.hostOnly && !c.name.startsWith("__Host-")) details.domain = c.domain;
  if (c.expirationDate) details.expirationDate = c.expirationDate;
  if (c.partitionKey && c.partitionKey.topLevelSite) details.partitionKey = c.partitionKey;

  try {
    await chrome.cookies.set(details);
  } catch (e) {
    console.warn("set gagal:", c.name, e.message);
  }
}

async function reloadTabs() {
  const tabs = await chrome.tabs.query({
    url: ["https://chatgpt.com/*", "https://*.chatgpt.com/*", "https://*.openai.com/*"]
  });

  for (const t of tabs) {
    try {
      // Jika tab berada pada percakapan spesifik (/c/...) milik akun sebelumnya atau di halaman auth,
      // arahkan kembali ke root https://chatgpt.com/ agar tidak memicu error 404 "Conversation not found"
      if (
        t.url &&
        (t.url.includes("/c/") || t.url.includes("/auth") || t.url.includes("/login"))
      ) {
        await chrome.tabs.update(t.id, { url: "https://chatgpt.com/" });
      } else {
        await chrome.tabs.reload(t.id);
      }
    } catch {}
  }

  if (!tabs.length) {
    await chrome.tabs.create({ url: "https://chatgpt.com/" });
  }
}

async function switchTo(id) {
  switchingUntil = Date.now() + 3500;
  try {
    const { accounts = [] } = await chrome.storage.local.get("accounts");
    const acc = accounts.find((a) => a.id === id);
    if (!acc) throw new Error("Akun tidak ditemukan.");

    const nowSec = Date.now() / 1000;
    const fresh = acc.cookies.filter((c) => !c.expirationDate || c.expirationDate > nowSec);

    for (const c of await allCookies()) {
      try {
        const removeDetails = { url: cookieUrl(c), name: c.name, storeId: c.storeId };
        if (c.partitionKey) removeDetails.partitionKey = c.partitionKey;
        await chrome.cookies.remove(removeDetails);
      } catch {}
    }

    for (const c of fresh) await setCookie(c);

    await chrome.storage.local.set({ currentId: id });
    await reloadTabs();
    return fresh.length;
  } finally {
    switchingUntil = Date.now() + 2500;
  }
}

// Injeksi otomatis content script ke tab yang sudah terbuka saat ekstensi dipasang/dimuat ulang
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({
      url: ["https://chatgpt.com/*", "https://*.chatgpt.com/*"]
    });
    for (const t of tabs) {
      if (t.id) {
        await chrome.scripting
          .executeScript({
            target: { tabId: t.id },
            files: ["content.js"]
          })
          .catch(() => {});
      }
    }
  } catch {}
});

chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  (async () => {
    try {
      if (msg.type === "chat_ready") {
        scheduleAutoCapture(400);
        send({ ok: true });
      } else if (msg.type === "capture") {
        send({ ok: true, account: await capture(msg.label) });
      } else if (msg.type === "switch") {
        send({ ok: true, count: await switchTo(msg.id) });
      } else if (msg.type === "status") {
        const { accounts = [], currentId = null } = await chrome.storage.local.get([
          "accounts",
          "currentId"
        ]);
        send({ ok: true, accounts, currentId, sig: sigOf(await allCookies()) });
      } else if (msg.type === "rename") {
        const { accounts = [] } = await chrome.storage.local.get("accounts");
        const next = accounts.map((a) => (a.id === msg.id ? { ...a, label: msg.label } : a));
        await chrome.storage.local.set({ accounts: next });
        send({ ok: true });
      } else if (msg.type === "delete") {
        const { accounts = [], currentId = null } = await chrome.storage.local.get([
          "accounts",
          "currentId"
        ]);
        await chrome.storage.local.set({
          accounts: accounts.filter((a) => a.id !== msg.id),
          currentId: currentId === msg.id ? null : currentId
        });
        send({ ok: true });
      } else {
        send({ ok: false, error: "Perintah tidak dikenal." });
      }
    } catch (e) {
      send({ ok: false, error: e.message || String(e) });
    }
  })();
  return true;
});
