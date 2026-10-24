/**
 * Le Cheese — penerima pesanan dari website → Spreadsheet REKAP_BATCH_1
 *
 * Pasang: buka spreadsheet REKAP_BATCH_1 → Ekstensi → Apps Script → tempel file ini → Simpan →
 * Terapkan → Deployment baru → Aplikasi web (Jalankan sebagai: Saya, Akses: Siapa saja) →
 * salin URL /exec ke SCRIPT_URL di js/main.js.
 *
 * Yang ditulis script (kolom kuning / isian manual saja, kolom rumus TIDAK disentuh):
 *   Gabungan    : A ID, B Tanggal, C Pelanggan, D Bite, E Classic, H Total Bayar, I Metode,
 *                 J Status, K Bayar 1 (DP), O Bukti TF (=HYPERLINK ke ORD-XXXXX.jpg di folder bukti)
 *                 (F Varian, G Cek detail, M Total Masuk, N Sisa tetap rumus)
 *   Detail Item : A ID, D Produk, E Rasa, F Topping, G Qty — satu baris per item
 *                 (B Pelanggan & C Status tetap ARRAYFORMULA)
 */

// ===== PENGATURAN =====
const SHEET_GABUNGAN = "Gabungan";
const SHEET_DETAIL = "Detail Item";
const FOLDER_BUKTI_ID = "1BlmsosZydZ7XOfPrhXc4fb4sqiES-dGN"; // folder "Folder bukti TF" di ringkasan
const ZONA_WAKTU = "Asia/Jakarta";      // jam pesanan ditulis sesuai WIB
const STATUS_AWAL = "Menunggu";         // admin ganti ke "Sudah dibayar" setelah cek bukti
const ISI_BAYAR_OTOMATIS = false;       // false = Bayar 1 kosong sampai admin cek bukti (seperti contoh baris "Menunggu"); true = langsung diisi total
const BATAS_GABUNGAN = 301;             // rumus ringkasan membaca A2:A301
const BATAS_DETAIL = 601;               // rumus Detail Item membaca A2:A601

// Nilai yang dibolehkan dropdown di sheet
const PRODUK = ["Bite", "Classic"];
const RASA = ["Original", "Chocolate", "Matcha"];
const TOPPING = ["Tanpa topping", "Selai blueberry", "Selai strawberry", "Drizzle matcha", "Drizzle cokelat", "Salted Caramel"];
const HARGA = { Bite: 12000, Classic: 18000 };
const PAKET = { Bite: { isi: 3, harga: 35000 }, Classic: { isi: 2, harga: 35000 } };

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const d = JSON.parse(e.postData.contents);

    // --- validasi item ---
    const items = (d.items || [])
      .map((it) => ({
        produk: String(it.produk || ""),
        rasa: String(it.rasa || ""),
        topping: String(it.topping || ""),
        qty: Math.floor(Number(it.qty) || 0),
      }))
      .filter((it) => it.qty > 0 && PRODUK.includes(it.produk) && RASA.includes(it.rasa) && TOPPING.includes(it.topping));
    if (!items.length) return json_({ status: "error", message: "Pesanan kosong / tidak valid" });

    const nama = String(d.nama || "").trim().slice(0, 80);
    const telepon = String(d.telepon || "").trim().slice(0, 20);
    if (!nama) return json_({ status: "error", message: "Nama kosong" });

    const qtyBite = items.filter((i) => i.produk === "Bite").reduce((a, i) => a + i.qty, 0);
    const qtyClassic = items.filter((i) => i.produk === "Classic").reduce((a, i) => a + i.qty, 0);
    const total = hitungTotal_(qtyBite, qtyClassic); // dihitung ulang di server, bukan percaya angka dari web

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const gab = ss.getSheetByName(SHEET_GABUNGAN);
    const det = ss.getSheetByName(SHEET_DETAIL);

    // --- ID pesanan ORD-XXXXX (unik) ---
    const idAda = gab.getRange(2, 1, BATAS_GABUNGAN - 1, 1).getValues().flat().map(String);
    let id = /^ORD-[A-Z0-9]{5}$/.test(d.id || "") ? d.id : buatId_();
    while (idAda.includes(id)) id = buatId_();

    // --- baris kosong pertama (lihat kolom A, karena kolom rumus sudah terisi sampai bawah) ---
    const barisG = barisKosong_(gab, BATAS_GABUNGAN);
    const barisD = barisKosong_(det, BATAS_DETAIL);
    if (!barisG) return json_({ status: "error", message: "Sheet Gabungan penuh (baris " + BATAS_GABUNGAN + ")" });
    if (!barisD || barisD + items.length - 1 > BATAS_DETAIL) return json_({ status: "error", message: "Sheet Detail Item penuh" });

    // --- simpan bukti ke folder Drive ---
    // nama file sama seperti contoh di folder: ORD-XXXXX.jpg
    let linkBukti = "";
    if (d.buktiBase64) {
      const blob = Utilities.newBlob(Utilities.base64Decode(d.buktiBase64), d.buktiMime || "image/jpeg", id + ".jpg");
      const file = DriveApp.getFolderById(FOLDER_BUKTI_ID).createFile(blob);
      linkBukti = "https://drive.google.com/file/d/" + file.getId() + "/view";
    }

    // --- tanggal: jam WIB, ditulis sebagai tanggal asli (bukan teks) ---
    const now = new Date();
    const tanggal = Utilities.parseDate(Utilities.formatDate(now, ZONA_WAKTU, "yyyy-MM-dd HH:mm"), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd HH:mm");

    // --- Gabungan: A–E, H–K, O (F, G, L, M, N tidak ditimpa) ---
    gab.getRange(barisG, 1, 1, 5).setValues([[id, tanggal, nama, qtyBite || "", qtyClassic || ""]]);
    gab.getRange(barisG, 8, 1, 4).setValues([[total, "QRIS", STATUS_AWAL, ISI_BAYAR_OTOMATIS ? total : ""]]);
    // Bukti TF: rumus sama seperti baris contoh → =HYPERLINK("…/file/d/ID/view"; "Lihat bukti")
    if (linkBukti) gab.getRange(barisG, 15).setFormula('=HYPERLINK("' + linkBukti + '", "Lihat bukti")');
    if (telepon) gab.getRange(barisG, 3).setNote("WA: " + telepon);

    // --- Detail Item: A, D–G per item (B & C ARRAYFORMULA tidak ditimpa) ---
    det.getRange(barisD, 1, items.length, 1).setValues(items.map(() => [id]));
    det.getRange(barisD, 4, items.length, 4).setValues(items.map((i) => [i.produk, i.rasa, i.topping, i.qty]));

    SpreadsheetApp.flush();
    return json_({ status: "success", id: id, total: total });
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ status: "ok", message: "Le Cheese order API aktif" });
}

function hitungTotal_(bite, classic) {
  const satu = (n, p) => Math.floor(n / PAKET[p].isi) * PAKET[p].harga + (n % PAKET[p].isi) * HARGA[p];
  return satu(bite, "Bite") + satu(classic, "Classic");
}

function buatId_() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "ORD-";
  for (let i = 0; i < 5; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return s;
}

function barisKosong_(sheet, batas) {
  const kolA = sheet.getRange(2, 1, batas - 1, 1).getValues();
  for (let i = 0; i < kolA.length; i++) if (kolA[i][0] === "") return i + 2;
  return 0;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Jalankan sekali dari editor (pilih fungsi ini → Jalankan) untuk memberi izin akses Sheet & Drive. */
function tesIzin() {
  Logger.log(SpreadsheetApp.getActiveSpreadsheet().getName());
  Logger.log(DriveApp.getFolderById(FOLDER_BUKTI_ID).getName());
}
