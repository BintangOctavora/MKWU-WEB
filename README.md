# Le Cheese — Website Pemesanan

```
lecheese/
├── index.html          ← struktur halaman
├── css/
│   └── style.css       ← semua tampilan (warna, layout, animasi)
├── js/
│   └── main.js         ← saklar buka/tutup order, data menu, keranjang, Paket Bestie, form & kirim pesanan
├── apps-script/
│   └── Code.gs         ← kode Google Apps Script (simpan pesanan ke Spreadsheet + bukti ke Drive)
└── img/
    ├── bg-bunga.webp       ← latar hero
    ├── matcha-drip.webp    ← lelehan matcha di atas
    ├── logo.png            ← logo navbar & avatar chat
    ├── megafon.webp        ← banner Paket Bestie
    ├── foto-hero.jpg       ← foto polaroid di Beranda
    ├── qris.png            ← (TAMBAHKAN) gambar QRIS Le Cheese
    └── menu/               ← foto tiap menu
        ├── bite-original.jpg
        ├── bite-chocolate.jpg
        ├── bite-matcha.jpg
        ├── classic-original.jpg
        ├── classic-chocolate.jpg
        └── classic-matcha.jpg
```

## Alur pemesanan

1. Pembeli memilih rasa + topping di kartu menu (Paket Bestie otomatis dihitung).
2. Pembeli mengisi **Nama dan Nomor WhatsApp**.
3. Pembeli membayar lewat **QRIS** (bisa simpan / perbesar gambar QRIS), lalu **upload foto bukti bayar**.
   Foto otomatis dikompres di browser (maks. lebar 900 px, JPEG) supaya upload cepat.
4. Tombol **Kirim Pesanan**:
   - mengecek semua isian wajib (keranjang, nama, nomor WA, bukti QRIS),
   - mengirim data + foto bukti ke **Google Spreadsheet** (jika `SCRIPT_URL` sudah diisi),
   - membuka **WhatsApp admin** dengan pesan pesanan yang sudah terisi,
   - mengosongkan keranjang dan form.

## Buka / tutup batch

Di baris paling atas `js/main.js`:

```js
const BUKA_ORDER = true; // false = muncul "Kuota Batch Ini Penuh!" dan form + tombol menu dikunci
```

## Menyambungkan ke Google Spreadsheet

Script sudah disesuaikan dengan spreadsheet **REKAP_BATCH_1** (sheet _Gabungan_ + _Detail Item_).

1. Buka spreadsheet **REKAP_BATCH_1**.
2. Menu **Ekstensi → Apps Script**. Hapus isi editor, lalu tempel seluruh isi `apps-script/Code.gs`. Simpan.
   Pilih fungsi `tesIzin` → **Jalankan** → izinkan akses (Sheet + Drive).
3. Klik **Terapkan → Deployment baru** → pilih jenis **Aplikasi web**:
   - _Jalankan sebagai_: **Saya**
   - _Yang memiliki akses_: **Siapa saja**
4. Klik **Terapkan**, izinkan aksesnya, lalu salin **URL aplikasi web** (berakhiran `/exec`).
5. Tempel URL itu ke `js/main.js`:

   ```js
   const SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";
   ```

Setiap pesanan dari web:

- **Gabungan** → 1 baris baru: ID `ORD-XXXXX`, Tanggal (WIB), Pelanggan (nomor WA ada di catatan sel),
  Bite/Classic qty, Total Bayar, Metode `QRIS`, Status `Menunggu`, Bukti TF = `=HYPERLINK(...; "Lihat bukti")`.
  Kolom rumus (Varian, Cek detail, Total Masuk, Sisa) tidak disentuh, jadi tetap otomatis.
- **Detail Item** → 1 baris per item (ID, Produk, Rasa, Topping, Qty). Pelanggan & Status tetap dari ARRAYFORMULA.
- Foto bukti masuk ke **Folder bukti TF** (link "Buka folder" di ringkasan) dengan nama `ORD-XXXXX.jpg`.

Admin cek bukti, lalu ganti Status `Menunggu` → `Sudah dibayar` dan isi **Bayar 1 (DP)** (atau set `Dibatalkan`).
ID pesanan juga ikut di pesan WhatsApp, jadi gampang dicocokkan dengan baris di sheet.

Pengaturan ada di atas `Code.gs`: `STATUS_AWAL`, `ISI_BAYAR_OTOMATIS` (true = Bayar 1 langsung diisi total),
`FOLDER_BUKTI_ID`, `ZONA_WAKTU`.

> Kalau kode Apps Script diubah, buat **deployment versi baru** (Kelola deployment → Edit → Versi baru)
> supaya perubahan aktif. URL `/exec` tetap sama.

Selama `SCRIPT_URL` masih kosong, pesanan tetap bisa dikirim — hanya lewat WhatsApp (tidak tercatat di Spreadsheet).

## Mengubah isi

- **Harga, topping, nomor WhatsApp, Paket Bestie** → bagian atas `js/main.js`
  (`WA_NUMBER`, `BUNDLES`, `TOPPINGS`, `PRODUCTS`).
- **Gambar QRIS** → simpan sebagai `img/qris.png`. Selama file belum ada, kotak QRIS menampilkan placeholder.
- **Warna & font** → blok `:root` di awal `css/style.css`.

## Menjalankan

Buka `index.html` langsung di browser, atau pakai ekstensi _Live Server_ di VS Code.
