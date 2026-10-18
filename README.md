# Le Cheese — Website Pemesanan

```
lecheese/
├── index.html          ← struktur halaman
├── css/
│   └── style.css       ← semua tampilan (warna, layout, animasi)
├── js/
│   └── main.js         ← data menu, keranjang, Paket Bestie, WhatsApp, navbar
└── img/
    ├── bg-bunga.webp       ← latar hero
    ├── matcha-drip.webp    ← lelehan matcha di atas
    ├── logo.png   ← logo navbar & avatar chat
    ├── megafon.webp        ← banner Paket Bestie
    ├── foto-hero.jpg       ← (tambahkan) foto polaroid di Beranda
    └── menu/               ← (tambahkan) foto tiap menu
        ├── bite-original.jpg
        ├── bite-chocolate.jpg
        ├── bite-matcha.jpg
        ├── classic-original.jpg
        ├── classic-chocolate.jpg
        └── classic-matcha.jpg
```

## Mengubah isi

- **Harga, topping, nomor WhatsApp, Paket Bestie** → bagian paling atas `js/main.js`
  (`WA_NUMBER`, `BUNDLES`, `TOPPINGS`, `PRODUCTS`).
- **Warna & font** → blok `:root` di awal `css/style.css`.
- **Foto** → taruh file dengan nama persis seperti di atas. Selama file belum ada,
  kotak foto menampilkan tulisan placeholder.

## Menjalankan

Buka `index.html` langsung di browser, atau pakai ekstensi _Live Server_ di VS Code.
