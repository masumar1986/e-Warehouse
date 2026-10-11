# PANDUAN INSTALASI — e-Warehouse (Backend GAS + Frontend GitHub Pages)

```
Browser/HP ──► GitHub Pages (index.html, css/, js/)  ──fetch──►  Google Apps Script (API JSON) ──► Sheets / Drive
```
Database Google Sheets **yang lama tetap dipakai** — tidak ada data yang dipindah.

---
## BAGIAN A — Backend (Google Apps Script)

1. Buka proyek Apps Script e-Warehouse **yang lama** (jangan buat proyek baru).
2. Ganti seluruh isi file **`Kode`** dengan isi file **`Kode-API.gs`**.
3. Hapus file HTML lama: `Index`, `Stylesheet`, `JavaScript`, `JavaScript2`–`JavaScript5` (klik titik tiga → Remove).
4. ⚠️ **JANGAN** menjalankan `setupAppEnvironment` lagi (database sudah ada).
5. **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy.**
   Pastikan: **Execute as = Me** dan **Who has access = Anyone**.
6. Salin **URL Web app** (berakhiran `/exec`).
7. **Tes:** tempel URL itu di tab browser baru. Harus tampil teks JSON: `{"success":true,"data":{"app":"e-Warehouse","status":"online",...}`. Kalau tampil halaman login Google / error, ulangi langkah 5 (akses harus *Anyone*).

---
## BAGIAN B — Siapkan Frontend

1. Ekstrak `e-warehouse-frontend.zip`. Hasilnya satu folder bernama **`e-warehouse`**.
2. Buka file `e-warehouse\js\config.js` dengan **Notepad**.
3. Ganti `PASTE_URL_EXEC_DISINI` dengan URL `/exec` dari Bagian A, simpan:
   ```js
   const API_URL = 'https://script.google.com/macros/s/AKfy.../exec';
   ```

---
## BAGIAN C — Upload ke GitHub Pages (lewat terminal)

> **Folder kerja Anda = folder `e-warehouse`** (yang berisi `index.html`). Semua perintah `git` dijalankan **di dalam folder itu** — jangan naik satu level, jangan masuk ke `css` atau `js`.
> Jangan memakai "Upload files" di web GitHub: struktur folder jadi rata dan CSS/JS menjadi 404.

**1. Install Git** — Windows: https://git-scm.com/download/win (pengaturan default). Buka **PowerShell**, cek: `git --version`

**2. Akun GitHub** — daftar di https://github.com (username jadi bagian alamat situs: `username.github.io`).

**3. Identitas Git (sekali saja):**
```
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@anda.com"
```

**4. Buat repository** — github.com → tombol **+** → **New repository** → nama: `e-warehouse` → **Public** → **jangan** centang README/.gitignore/license → Create.

**5. Masuk ke folder & verifikasi** — buka folder `e-warehouse` di File Explorer, klik address bar, ketik `powershell`, Enter. Lalu:
```
dir
```
Wajib terlihat **`index.html`**, folder **`css`**, folder **`js`** (dan `README.md`). Kalau yang terlihat justru folder `e-warehouse` lagi, Anda satu level terlalu tinggi → `cd e-warehouse` dulu. **Jangan lanjut sebelum `index.html` terlihat.**

**6. Push pertama** (satu per satu):
```
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/e-warehouse.git
git push -u origin main
```
(Ganti `USERNAME`. Tanda titik pada `git add .` wajib.) Saat diminta *Password*, isi **Personal Access Token** (bukan password akun). Layar tidak menampilkan apa pun saat mengetik/paste — itu normal.

**Membuat token:** https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo** → Generate → salin `ghp_...` (hanya tampil sekali). Alternatif tanpa terminal: *GitHub Desktop* → Add Local Repository → pilih folder `e-warehouse` → Publish.

**7. Aktifkan Pages** — di repo: **Settings → Pages** → Source: *Deploy from a branch* → Branch: **main** · **/ (root)** → Save → centang **Enforce HTTPS**. Tunggu 1–2 menit; muncul: `https://USERNAME.github.io/e-warehouse/`

**8. Uji** — buka alamat itu (tekan **Ctrl+Shift+R**). Di bawah tombol Masuk harus tertulis "**2) Server terhubung ✓**". Login `admin` / `admin123`, lalu segera ganti password di **Pengaturan**.

> 📱 Di HP: buka alamat yang sama di Chrome → menu ⋮ → **Tambahkan ke layar utama**. Scan barcode via kamera kini bekerja lebih baik karena memakai HTTPS langsung.

---
## Update di kemudian hari
Setelah mengubah file (dari folder `e-warehouse`):
```
git add .
git commit -m "Deskripsi perubahan"
git push
```
Tunggu 1–2 menit, lalu **Ctrl+Shift+R**. Jika **backend** (`Kode`) yang berubah: tempel kode baru → *Deploy → Manage deployments → pensil → New version → Deploy* (URL tetap sama, `config.js` tidak perlu diubah).

---
## Pemecahan masalah
| Yang terlihat | Penyebab → solusi |
|---|---|
| "API_URL belum diisi" | `js/config.js` belum diedit → isi URL `/exec`, lalu `git add .` / `commit` / `push` |
| "Balasan server bukan JSON" | Akses deployment bukan *Anyone*, atau belum *New version* → ulangi Bagian A langkah 5 |
| "Tidak bisa terhubung ke server" | Internet putus, atau URL salah/terpotong |
| Halaman 404 | `index.html` tidak di root repo → lihat repo di browser; kalau terlihat folder `e-warehouse/` di dalamnya, push ulang dari folder yang benar (`git push -u origin main --force`, aman karena isi lama memang salah) |
| Halaman tanpa warna/gaya, console "404" untuk css/js | File rata di root → pastikan folder `css/` dan `js/` ada; jangan upload lewat web |
| `Password authentication is not supported` | Pakai Personal Access Token sebagai password |
| `remote origin already exists` | Lewati; jika URL salah: `git remote set-url origin <url>` |
| `Updates were rejected…` | `git pull --rebase origin main` lalu `git push` |
| `LF will be replaced by CRLF` | Abaikan, hanya peringatan |
| Situs masih versi lama | Cache → Ctrl+Shift+R atau jendela Incognito |

**Catatan keamanan:** repository ini publik, tetapi berisi hanya kode tampilan dan alamat API — tidak ada password atau data. Akses data tetap dilindungi login aplikasi (password disimpan ter-hash di Google Sheets).

**Istilah:** *Repository* = folder proyek di GitHub · *Commit* = menyimpan perubahan dengan catatan · *Push* = mengirim ke GitHub · *Branch* = cabang versi (`main`).
