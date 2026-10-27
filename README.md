# Dzikri Mountain Guide

Landing page jasa guide & porter Gunung Ciremai via Palutungan. Situs statis tanpa build step: `index.html`, `assets/css/style.css`, `assets/js/main.js`. Font dan gambar di-host sendiri di `assets/` (tanpa CDN).

## Mengubah konten yang sering berubah
- **Nomor WhatsApp**: `6281214799020`, dipakai di semua link `wa.me` di `index.html` dan konstanta `WA` di `assets/js/main.js`.
- **Harga & DP kalkulator**: konstanta `OPEN_TRIP` dan `PRIVATE_DP` di `assets/js/main.js`, lalu sesuaikan teks harga di `index.html`.
- **Foto**: sumber asli ada di folder `foto foto …`; versi WebP yang dipakai situs ada di `assets/img/` (ukuran 320/480/960 px).

## Tes
```bash
npx http-server -p 5100 .           # atau server statis apa pun
node tests/site.test.cjs            # butuh Playwright
```
Tes memastikan semua link WhatsApp memakai nomor yang sama, kalkulator menghitung sesuai tabel harga, galeri/lightbox membuka foto yang benar, dan menu HP tidak terpotong.

## Versi sebelumnya
Situs sebelum redesign disimpan di tag `original-before-claude` dan branch `backup/original`:
```bash
git checkout main && git reset --hard original-before-claude
```
