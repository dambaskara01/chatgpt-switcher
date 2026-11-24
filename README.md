# ChatGPT Switcher

<p align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="ChatGPT Switcher Logo">
  <br>
  <b>Seamless multi-account switcher for ChatGPT.</b>
  <br>
  <i>Switch between multiple ChatGPT accounts in a single click without repetitive logins or logouts.</i>
</p>

---

## ✨ Features

- **⚡ 1-Click Fast Switching**: Switch ChatGPT accounts instantly without re-entering passwords or 2FA codes.
- **🤖 Silent Auto-Capture**: Automatically detects and saves your session as soon as you log in and reach the ChatGPT prompt area.
- **🔄 Auto-Update Session Tokens**: Active session cookies are automatically refreshed in the background to prevent premature expiration.
- **🔒 100% Local & Privacy-Friendly**: All session data and tokens are stored purely in your browser (`chrome.storage.local`). Zero third-party tracking or external server transmission.
- **🎨 Modern Dark UI**: Clean, high-craft, anti-slop dark mode interface with initial avatars, active status indicators, and sleek SVG action buttons.
- **✏️ Account Management**: Rename account labels or remove old profiles directly from the popup.

---

## 🚀 Installation Guide (Google Chrome / Brave / Edge)

Since this extension is not yet published on the Chrome Web Store, you can load it directly via **Developer Mode**:

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/dambaskara01/chatgpt-switcher.git
   ```
2. Open your Chromium-based browser (Chrome, Edge, Brave, etc.).
3. Navigate to the extensions page:
   - Type `chrome://extensions` in your address bar and press **Enter**.
4. Enable **Developer mode** (toggle located at the top-right corner).
5. Click **Load unpacked** (top-left button).
6. Select this project folder (`chatgpt-switcher`).
7. **ChatGPT Switcher** is now installed and ready to use!

---

## 💡 How It Works

1. Go to [chatgpt.com](https://chatgpt.com) and log in to your first account.
2. Once the main chat interface (prompt textarea) loads, the extension will automatically record the account.
3. Click the extension icon in your browser toolbar to view your saved accounts.
4. To add another account: log out on ChatGPT, then log in to your second account. It will be captured automatically.
5. To switch: click on any account in the popup list. Your ChatGPT tab will automatically reload directly into that account.

---

## 🛠️ Tech Stack

- **Platform**: Google Chrome Extension (Manifest V3)
- **Language**: Vanilla JavaScript, HTML5, CSS3 (Lightweight, zero external dependencies)
- **APIs**: Chrome Cookies API, Chrome Storage API, Chrome Tabs & Scripting API
