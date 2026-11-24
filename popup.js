const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const statusEl = document.getElementById("status");
const badgeEl = document.getElementById("badge");
const badgeTextEl = badgeEl.querySelector(".badge-text");

let isSwitchingUI = false;

function say(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = "status " + kind;
}

function ago(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.round(h / 24)} hari lalu`;
}

async function send(msg) {
  return chrome.runtime.sendMessage(msg);
}

function render(accounts, sig, currentId) {
  listEl.innerHTML = "";
  emptyEl.hidden = accounts.length > 0;

  for (const a of accounts) {
    const active = (currentId && a.id === currentId) || (a.sig && a.sig === sig);
    const row = document.createElement("div");
    row.className = "item" + (active ? " active" : "");

    // Avatar inisial
    const initial = (a.label || a.email || "U").trim().charAt(0).toUpperCase();
    const avatar = document.createElement("div");
    avatar.className = "item-avatar";
    avatar.textContent = initial;

    // Meta (nama & keterangan waktu)
    const meta = document.createElement("div");
    meta.className = "meta";

    const nameRow = document.createElement("div");
    nameRow.className = "name-row";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = a.label;
    nameRow.appendChild(name);

    if (active) {
      const activePill = document.createElement("span");
      activePill.className = "active-pill";
      activePill.textContent = "Aktif";
      nameRow.appendChild(activePill);
    }

    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = (active ? "Sesi aktif · " : "Tersimpan · ") + ago(a.updatedAt);

    meta.append(nameRow, sub);

    // Tombol Aksi (Rename & Delete)
    const acts = document.createElement("div");
    acts.className = "acts";

    const rename = document.createElement("button");
    rename.className = "iconbtn";
    rename.title = "Ganti nama";
    rename.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    `;
    rename.addEventListener("click", async (e) => {
      e.stopPropagation();
      const v = prompt("Nama baru:", a.label);
      if (!v || !v.trim()) return;
      await send({ type: "rename", id: a.id, label: v.trim() });
      load();
    });

    const del = document.createElement("button");
    del.className = "iconbtn del";
    del.title = "Hapus akun";
    del.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `;
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`Hapus "${a.label}"?`)) return;
      await send({ type: "delete", id: a.id });
      load();
    });

    acts.append(rename, del);
    row.append(avatar, meta, acts);

    row.addEventListener("click", async () => {
      if (isSwitchingUI) return;
      if (active) return say("Akun ini sedang aktif.", "");

      isSwitchingUI = true;
      say("Berpindah akun…");
      try {
        const r = await send({ type: "switch", id: a.id });
        if (!r?.ok) {
          say(r?.error || "Gagal berpindah.", "err");
        } else {
          say("Berhasil berpindah.", "ok");
          load();
        }
      } catch {
        say("Terjadi kesalahan saat berpindah.", "err");
      } finally {
        setTimeout(() => {
          isSwitchingUI = false;
        }, 1000);
      }
    });

    listEl.append(row);
  }

  const active = accounts.find((a) => (currentId && a.id === currentId) || (a.sig && a.sig === sig));
  if (active) {
    badgeTextEl.textContent = "Aktif";
    badgeEl.className = "badge on";
  } else if (sig) {
    badgeTextEl.textContent = "Sesi Baru";
    badgeEl.className = "badge new";
  } else {
    badgeTextEl.textContent = "Belum Login";
    badgeEl.className = "badge";
  }
}

async function load() {
  const r = await send({ type: "status" });
  if (!r?.ok) return say(r?.error || "Gagal memuat.", "err");
  render(r.accounts, r.sig, r.currentId);
}

// Auto reload saat storage berubah di background
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.accounts || changes.currentId)) {
    load();
  }
});

load();
