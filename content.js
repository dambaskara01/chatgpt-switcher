(() => {
  if (window.__CHATGPT_SWITCHER_INJECTED__) {
    return;
  }
  window.__CHATGPT_SWITCHER_INJECTED__ = true;

  function isChatReady() {
    const path = window.location.pathname;
    if (path.startsWith("/auth") || path.startsWith("/login")) {
      return false;
    }

    // Jika tombol login masih terlihat di layar, berarti user belum login (mode guest/logout)
    const loginBtn = document.querySelector(
      'a[href*="/login"], a[href*="/auth"], button[data-testid="login-button"]'
    );
    if (loginBtn) {
      return false;
    }

    // Cek keberadaan chat bar ChatGPT (#prompt-textarea atau form prompt)
    const chatBar =
      document.getElementById("prompt-textarea") ||
      document.querySelector('form textarea, form [contenteditable="true"]');

    return Boolean(chatBar);
  }

  let lastReportedTime = 0;
  let checkTimeout = null;

  function notifyIfReady() {
    if (isChatReady()) {
      const now = Date.now();
      // Beri jeda minimal 3 detik antar laporan agar tidak membanjiri pesan
      if (now - lastReportedTime > 3000) {
        lastReportedTime = now;
        try {
          chrome.runtime.sendMessage({ type: "chat_ready" });
        } catch {}
      }
    }
  }

  function scheduleCheck() {
    if (checkTimeout) clearTimeout(checkTimeout);
    checkTimeout = setTimeout(notifyIfReady, 600);
  }

  // Pantau perubahan DOM (misal navigasi SPA atau perpindahan dari auth ke chat)
  const observer = new MutationObserver(() => {
    scheduleCheck();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Cek saat pertama kali dimuat
  scheduleCheck();

  // Tanggapi pemeriksaan dari background script
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "is_chat_ready") {
      sendResponse({ ready: isChatReady() });
    }
  });
})();
