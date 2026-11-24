# ChatGPT Switcher

<p align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="ChatGPT Switcher Logo">
  <br>
  <b>Seamless multi-account switcher for ChatGPT.</b>
  <br>
  <i>Pindah antar akun ChatGPT dalam satu klik secara instan tanpa perlu repot login dan logout berulang kali.</i>
</p>

---

## ✨ Fitur Utama

- **⚡ 1-Click Fast Switching**: Berpindah akun ChatGPT secara instan tanpa harus mengetik password atau verifikasi ulang.
- **🤖 Silent Auto-Capture**: Ekstensi otomatis mendeteksi dan menyimpan sesi saat Anda berhasil login dan masuk ke antarmuka obrolan ChatGPT.
- **🔄 Auto-Update Token**: Cookie sesi aktif otomatis diperbarui di latar belakang agar sesi tidak cepat kedaluwarsa.
- **🔒 Privasi & Keamanan Lokal 100%**: Semua data sesi dan token disimpan secara lokal di browser (`chrome.storage.local`). Tidak ada data yang dikirim ke server pihak ketiga mana pun.
- **🎨 Modern Dark UI**: Desain antarmuka yang bersih, utilitarian (*anti-slop*), hemat ruang, dan responsif dengan tema gelap.
- **✏️ Manajemen Akun**: Ganti nama (*rename*) label akun atau hapus akun lama langsung dari popup.

---

## 🚀 Cara Instalasi di Browser (Google Chrome / Brave / Edge)

Karena ekstensi ini belum dipublikasikan ke Chrome Web Store, Anda dapat memasangnya langsung via **Developer Mode**:

1. **Unduh / Clone Repositori**:
   ```bash
   git clone https://github.com/dambaskara01/chatgpt-switcher.git
   ```
2. Buka browser Chromium favorit Anda (Chrome / Edge / Brave).
3. Masuk ke halaman pengelolaan ekstensi:
   - Ketik `chrome://extensions` di address bar, lalu tekan **Enter**.
4. Aktifkan **Developer mode** (toggle di pojok kanan atas).
5. Klik tombol **Load unpacked** (Muat yang belum dibongkar) di pojok kiri atas.
6. Pilih folder repositori ini (`chatgpt-switcher`).
7. Ekstensi **ChatGPT Switcher** selesai terpasang dan siap digunakan!

---

## 💡 Cara Penggunaan

1. Buka [chatgpt.com](https://chatgpt.com) dan login ke akun pertama Anda.
2. Saat halaman chat utama muncul, ekstensi akan otomatis mencatat akun tersebut.
3. Klik ikon ekstensi di toolbar browser untuk melihat daftar akun yang tersimpan.
4. Untuk menambah akun kedua: lakukan logout di tab ChatGPT, lalu login ke akun kedua Anda. Akun kedua akan otomatis tercatat.
5. Untuk berganti akun: cukup klik kartu akun yang diinginkan pada popup ekstensi. Tab ChatGPT akan dimuat ulang dan Anda langsung masuk ke akun tersebut.

---

## 🛠️ Tech Stack

- **Platform**: Google Chrome Extension (Manifest V3)
- **Language**: Vanilla JavaScript, HTML5, CSS3 (No bulky frameworks)
- **APIs**: Chrome Cookies API, Chrome Storage API, Chrome Tabs & Scripting API

---

## 📄 Lisensi

Proyek ini bersifat open-source di bawah lisensi [MIT License](LICENSE).
