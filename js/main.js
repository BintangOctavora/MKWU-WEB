/* Le Cheese — order logic & interactions */
/* ===== Data — edit prices / toppings here ===== */
const API_URL = "http://localhost:8000";
const API_TIMEOUT_MS = 8000;
const WA_NUMBER = "6285843745652"; // 085843745652 in international format
/* Paket Bestie: mix any flavor & topping within the same line */
const BUNDLES = [
  { line: "bite", name: "Paket Bestie Bite", size: 3, price: 35000 }, // 3 Le Mini Bite    = Rp35.000
  { line: "classic", name: "Paket Bestie Classic", size: 2, price: 35000 }, // 2 Le Mini Classic = Rp35.000
];
/* Toppings per flavor */
const TOPPINGS = {
  original: [
    "Tanpa topping",
    "Selai blueberry",
    "Selai strawberry",
    "Drizzle matcha",
    "Drizzle cokelat",
    "Salted Caramel",
  ],
  matcha: [
    "Tanpa topping",
    "Selai blueberry",
    "Selai strawberry",
    "Drizzle matcha",
    "Drizzle cokelat",
    "Salted Caramel",
  ],
  chocolate: [
    "Tanpa topping",
    "Selai blueberry",
    "Selai strawberry",
    "Drizzle matcha",
    "Drizzle cokelat",
    "Salted Caramel",
  ],
};

const FLAVORS = {
  original: { name: "Original" },
  chocolate: { name: "Chocolate" },
  matcha: { name: "Matcha" },
};
const PRODUCTS = [
  {
    id: "bite-original",
    line: "bite",
    label: "Le Mini Bite",
    flavor: "original",
    price: 12000,
  },
  {
    id: "bite-chocolate",
    line: "bite",
    label: "Le Mini Bite",
    flavor: "chocolate",
    price: 12000,
  },
  {
    id: "bite-matcha",
    line: "bite",
    label: "Le Mini Bite",
    flavor: "matcha",
    price: 12000,
  },
  {
    id: "classic-original",
    line: "classic",
    label: "Le Mini Classic",
    flavor: "original",
    price: 18000,
  },
  {
    id: "classic-chocolate",
    line: "classic",
    label: "Le Mini Classic",
    flavor: "chocolate",
    price: 18000,
  },
  {
    id: "classic-matcha",
    line: "classic",
    label: "Le Mini Classic",
    flavor: "matcha",
    price: 18000,
  },
];

/* Each card tracks a count per topping, so one flavor can be ordered with different toppings. */
const state = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, { sel: "", counts: {} }]),
);
const shortTop = (t) => t.replace(/^(Selai|Drizzle) /, "");
const rupiah = (n) => "Rp. " + n.toLocaleString("id-ID");
const iconMinus =
  '<svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="#2B1D20" stroke-width="2.4" stroke-linecap="round"/></svg>';
const iconPlus =
  '<svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#2B1D20" stroke-width="2.4" stroke-linecap="round"/></svg>';
const caret =
  '<svg width="21" height="16" viewBox="0 0 21 16" aria-hidden="true"><path d="M5 6l5.5 5L16 6" stroke="#E8467C" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ===== Render cards ===== */
PRODUCTS.forEach((p) => {
  const f = FLAVORS[p.flavor];
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = p.id;
  card.dataset.line = p.line;
  card.dataset.qty = "0";
  card.innerHTML = `
    <span class="tape${p.flavor === "matcha" ? " green" : ""}" aria-hidden="true"></span>
    <div class="card-img">
      <span class="ph">Foto ${p.label.replace("Le Mini ", "")} ${f.name}</span>
      <img src="img/menu/${p.id}.jpg" alt="${p.label} rasa ${f.name}" loading="lazy" data-photo>
      <span class="flavor-tag">${p.line === "bite" ? "±80 g" : "±150 g"}</span>
    </div>
    <h4>${f.name}</h4>
    <div class="topping">
      <label for="top-${p.id}">Topping :</label>
      <div class="select-wrap">
        <select id="top-${p.id}" class="placeholder">
          <option value="" selected>Pilih topping</option>
          ${TOPPINGS[p.flavor].map((t) => `<option value="${t}">${t}</option>`).join("")}
        </select>${caret}
      </div>
    </div>
    <p class="price">${rupiah(p.price)}</p>
    <div class="qty">
      <button type="button" data-step="-1" aria-label="Kurangi ${p.label} ${f.name}" disabled>${iconMinus}</button>
      <button type="button" data-step="1" aria-label="Tambah ${p.label} ${f.name}">${iconPlus}</button>
      <output aria-live="polite">0</output>
    </div>
    <p class="card-hint" aria-live="polite"></p>
    <ul class="chips" aria-label="Topping yang sudah dipesan"></ul>`;
  document.querySelector(`.cards[data-line="${p.line}"]`).appendChild(card);

  const s = state[p.id];
  const sel = card.querySelector("select");
  const out = card.querySelector("output");
  const minus = card.querySelector('[data-step="-1"]');
  const hint = card.querySelector(".card-hint");
  const chips = card.querySelector(".chips");

  function render() {
    const q = s.sel ? s.counts[s.sel] || 0 : 0;
    out.textContent = q;
    out.setAttribute(
      "aria-label",
      `Jumlah ${p.label} ${f.name}, topping ${s.sel || "belum dipilih"}`,
    );
    minus.disabled = q === 0;
    sel.value = s.sel;
    sel.classList.toggle("placeholder", !s.sel);
    const totalQty = Object.values(s.counts).reduce((a, b) => a + b, 0);
    card.classList.toggle("has-qty", totalQty > 0);
    card.dataset.qty = totalQty;
    chips.innerHTML = "";
    TOPPINGS[p.flavor]
      .filter((t) => s.counts[t])
      .forEach((t) => {
        const li = document.createElement("li");
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = `${shortTop(t)} ×${s.counts[t]}`;
        b.setAttribute("aria-pressed", String(t === s.sel));
        b.addEventListener("click", () => {
          s.sel = t;
          hint.textContent = "";
          render();
        });
        li.appendChild(b);
        chips.appendChild(li);
      });
  }

  sel.addEventListener("change", () => {
    s.sel = sel.value;
    hint.textContent = "";
    render();
  });
  card.querySelectorAll("button[data-step]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!s.sel) {
        hint.textContent = "Pilih topping dulu, lalu tekan +.";
        sel.focus();
        return;
      }
      const next = Math.max(
        0,
        Math.min(99, (s.counts[s.sel] || 0) + Number(btn.dataset.step)),
      );
      if (next) s.counts[s.sel] = next;
      else delete s.counts[s.sel];
      hint.textContent = "";
      render();
      update();
      card.classList.remove("bump");
      void card.offsetWidth;
      card.classList.add("bump");
    }),
  );
  render();
});

/* ===== Real photos: hide the <img> and keep the placeholder until the file exists ===== */
document.querySelectorAll("img[data-photo]").forEach((img) => {
  const miss = () => img.setAttribute("data-missing", "");
  if (img.complete && img.naturalWidth === 0) miss();
  img.addEventListener("error", miss);
});

/* ===== Cart ===== */
function cart() {
  const lines = [];
  PRODUCTS.forEach((p) => {
    const s = state[p.id];
    TOPPINGS[p.flavor]
      .filter((t) => s.counts[t])
      .forEach((t) => {
        const qty = s.counts[t];
        lines.push({
          text: `${qty}× ${p.label} ${FLAVORS[p.flavor].name} (${t})`,
          subtotal: qty * p.price,
          qty,
          topping: t,
        p,
      });
    });
  });
  const deals = BUNDLES.map((b) => {
    const qty = lines
      .filter((l) => l.p.line === b.line)
      .reduce((a, l) => a + l.qty, 0);
    const unit = PRODUCTS.find((p) => p.line === b.line).price;
    const count = Math.floor(qty / b.size);
    const saving = count * Math.max(0, b.size * unit - b.price);
    return { ...b, qty, count, saving };
  });
  const discount = deals.reduce((a, d) => a + d.saving, 0);
  const total = lines.reduce((a, l) => a + l.subtotal, 0) - discount;
  return { lines, deals, discount, total };
}

const listEl = document.getElementById("order-list");
const emptyEl = document.getElementById("order-empty");
const totalEl = document.getElementById("order-total");
const nameEl = document.getElementById("nama");
const msgEl = document.getElementById("form-msg");
const waBtn = document.getElementById("wa-btn");
const fab = document.getElementById("cart-fab");
let sending = false;
let pendingOrder = null;
let hasItems = false,
  orderVisible = false;
function syncFab() {
  fab.classList.toggle("away", !hasItems || orderVisible);
}
try {
  new IntersectionObserver(
    (es) => {
      orderVisible = es[0].isIntersecting;
      syncFab();
    },
    { threshold: 0.25 },
  ).observe(document.querySelector(".order"));
} catch (_) {}

function update() {
  const c = cart();
  listEl.innerHTML = "";
  c.lines.forEach((l) => {
    const li = document.createElement("li");
    li.innerHTML = `<span></span><span>${rupiah(l.subtotal)}</span>`;
    li.firstChild.textContent = l.text;
    listEl.appendChild(li);
  });
  c.deals
    .filter((d) => d.saving > 0)
    .forEach((d) => {
      const li = document.createElement("li");
      li.className = "disc";
      li.innerHTML = `<span>${d.name} ×${d.count}</span><span>−${rupiah(d.saving)}</span>`;
      listEl.appendChild(li);
    });
  listEl.hidden = c.lines.length === 0;
  emptyEl.hidden = c.lines.length > 0;
  document.getElementById("bubble-total").textContent = rupiah(c.total);
  if (totalEl.textContent !== rupiah(c.total)) {
    totalEl.textContent = rupiah(c.total);
    totalEl.classList.remove("pop");
    void totalEl.offsetWidth;
    totalEl.classList.add("pop");
  }
  // Paket Bestie meters (one per line)
  c.deals.forEach((d) => {
    const row = document.querySelector(`.meter[data-line="${d.line}"]`);
    if (!row) return;
    const short = d.line === "bite" ? "Bite" : "Classic";
    const filled = d.qty === 0 ? 0 : d.qty % d.size || d.size;
    row
      .querySelectorAll(".dots span")
      .forEach((s, i) => s.classList.toggle("on", i < filled));
    const rem = d.size - (d.qty % d.size);
    row.closest(".bestie").classList.toggle("active", d.count > 0);
    row.querySelector(".bestie-msg").textContent =
      d.qty === 0
        ? `Tambah ${d.size} ${short} untuk harga paket.`
        : rem === d.size
          ? `Aktif ×${d.count}. Hemat ${rupiah(d.saving)}.`
          : `Tambah ${rem} ${short} lagi untuk ${d.count ? "paket berikutnya" : "harga paket"}.`;
  });
  // Floating cart
  const count = c.lines.reduce((a, l) => a + l.qty, 0);
  const fabCount = document.getElementById("fab-count");
  if (fabCount.textContent !== String(count)) {
    fab.classList.remove("bump");
    void fab.offsetWidth;
    fab.classList.add("bump");
  }
  fabCount.textContent = count;
  document.getElementById("fab-total").textContent = rupiah(c.total);
  hasItems = count > 0;
  syncFab();
  syncWa(c);
}

/* WhatsApp button is only active when the cart has items AND a name is filled in. */
function syncWa(c = cart()) {
  const hasName = nameEl.value.trim().length > 0;
  document.getElementById("bubble-name").textContent =
    nameEl.value.trim() || "-";
  if (sending) {
    waBtn.setAttribute("aria-disabled", "true");
    msgEl.textContent = "Membuat pesanan…";
    return;
  }
  const ok = hasName && c.lines.length > 0;
  if (ok) {
    waBtn.href = waLink(c);
    waBtn.removeAttribute("aria-disabled");
    waBtn.removeAttribute("tabindex");
    msgEl.textContent = "";
  } else {
    waBtn.removeAttribute("href");
    waBtn.setAttribute("aria-disabled", "true");
    msgEl.textContent = !c.lines.length
      ? "Tambahkan minimal 1 cheesecake untuk mengaktifkan tombol."
      : "Isi Nama Lengkap dulu untuk mengaktifkan tombol.";
  }
}

function waLink(c) {
  const nama = nameEl.value.trim();
  const rows = c.lines.map((l) => `- ${l.text}: ${rupiah(l.subtotal)}`);
  c.deals
    .filter((d) => d.saving > 0)
    .forEach((d) => rows.push(`- ${d.name} ×${d.count}: −${rupiah(d.saving)}`));
  const text = [
    "Halo Le Cheese, saya mau pesan:",
    ...rows,
    "",
    `Total: ${rupiah(c.total)}`,
    `Nama: ${nama || "-"}`,
  ].join("\n");
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

nameEl.addEventListener("input", () => syncWa());
document
  .getElementById("order-form")
  .addEventListener("submit", (e) => e.preventDefault());
waBtn.addEventListener("click", async (e) => {
  if (sending) {
    e.preventDefault();
    return;
  }
  if (waBtn.getAttribute("aria-disabled") === "true") {
    e.preventDefault();
    if (!nameEl.value.trim()) nameEl.focus();
    return;
  }
  if (!API_URL) {
    waBtn.href = waLink(cart());
    msgEl.textContent =
      "Membuka WhatsApp… Kalau tidak terbuka, chat manual ke 085843745652.";
    return;
  }

  e.preventDefault();
  const c = cart();
  const customerName = nameEl.value.trim();
  const request = {};
  pendingOrder = request;
  sending = true;
  syncWa(c);
  try {
    request.controller = new AbortController();
    request.timeout = setTimeout(
      () => request.controller.abort(),
      API_TIMEOUT_MS,
    );
    const response = await fetch(API_URL + "/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: request.controller.signal,
      body: JSON.stringify({
        customer_name: customerName,
        items: c.lines.map((l) => ({
          product_id: l.p.id,
          topping: l.topping,
          qty: l.qty,
        })),
      }),
    });
    if (!response.ok) {
      throw new Error(`POST /orders gagal: HTTP ${response.status}`);
    }
    const data = await response.json();
    if (pendingOrder !== request) return;
    if (typeof data?.wa_url !== "string" || !data.wa_url.startsWith("https://wa.me/")) {
      throw new Error("Respons /orders memiliki wa_url tidak valid");
    }
    if (data.total !== c.total) {
      console.warn("Total server berbeda dari tampilan; total server berlaku.", {
        server: data.total,
        cart: c.total,
      });
    }
    location.href = data.wa_url;
  } catch (error) {
    if (pendingOrder !== request) return;
    console.warn("Gagal membuat pesanan; membuka WhatsApp cadangan.", error);
    location.href = waLink(cart());
  } finally {
    clearTimeout(request.timeout);
    if (pendingOrder === request) {
      pendingOrder = null;
      sending = false;
      syncWa();
    }
  }
});

addEventListener("pageshow", () => {
  if (!API_URL) return;
  const request = pendingOrder;
  pendingOrder = null;
  clearTimeout(request?.timeout);
  request?.controller?.abort();
  sending = false;
  syncWa();
});

/* ===== Copy phone ===== */
document.querySelectorAll("[data-copy]").forEach((b) =>
  b.addEventListener("click", () => {
    const done = () => {
      b.textContent = "Tersalin";
      setTimeout(() => (b.textContent = "Salin"), 1600);
    };
    try {
      navigator.clipboard
        .writeText(b.dataset.copy)
        .then(done)
        .catch(selectPhone);
    } catch (_) {
      selectPhone();
    }
  }),
);
function selectPhone() {
  const r = document.createRange();
  r.selectNodeContents(document.getElementById("phone"));
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

/* ===== Hamburger menu ===== */
const navWrap = document.querySelector(".nav");
const burger = document.getElementById("burger");
function setMenu(open) {
  navWrap.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
}
burger.addEventListener("click", () =>
  setMenu(!navWrap.classList.contains("open")),
);
document
  .querySelectorAll(".nav-links a")
  .forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navWrap.classList.contains("open")) {
    setMenu(false);
    burger.focus();
  }
});
document.addEventListener("click", (e) => {
  if (!navWrap.contains(e.target)) setMenu(false);
});
addEventListener("resize", () => {
  if (innerWidth > 760) setMenu(false);
});

/* ===== Ransom-note titles (random paper, font and tilt per letter) ===== */
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.round(rnd(a, b));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const PAPERS = [
  ["#1C9BC2", "#FFF8F0"],
  ["#FFF8F0", "#2B1D20"],
  ["#E8467C", "#FFF8F0"],
  ["#F6C945", "#2B1D20"],
  ["#2B1D20", "#FFF8F0"],
  ["#FFFFFF", "#E8467C"],
  ["#D9BC92", "#2B1D20"],
  ["#8F9546", "#FFF8F0"],
];
const FACES = [
  '"Bagel Fat One"',
  '"Abril Fatface"',
  '"Bowlby One"',
  '"Shrikhand"',
  '"Courier Prime"',
];
document.querySelectorAll("[data-ransom]").forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.textContent = "";
  let last = -1;
  [...text].forEach((ch) => {
    const s = document.createElement("span");
    s.setAttribute("aria-hidden", "true");
    if (ch === " ") {
      s.className = "sp";
      el.appendChild(s);
      return;
    }
    let i;
    do {
      i = Math.floor(Math.random() * PAPERS.length);
    } while (i === last);
    last = i;
    const [bg, fg] = PAPERS[i];
    s.className = "ch";
    s.textContent = Math.random() < 0.55 ? ch.toUpperCase() : ch.toLowerCase();
    s.style.cssText =
      `background:${bg};color:${fg};font-family:${pick(FACES)},serif;--r:${rnd(-9, 9).toFixed(1)}deg;--y:${rnd(-6, 6).toFixed(1)}px;` +
      `clip-path:polygon(${rndi(0, 8)}% ${rndi(0, 8)}%,${rndi(92, 100)}% ${rndi(0, 8)}%,${rndi(92, 100)}% ${rndi(92, 100)}%,${rndi(0, 8)}% ${rndi(92, 100)}%);` +
      `font-size:${rnd(0.88, 1.1).toFixed(2)}em`;
    el.appendChild(s);
  });
});

/* ===== Bands: soft random wave on top + random drips below ===== */
function wavePath(W, H, n, lo, hi) {
  const ys = Array.from({ length: n }, () => lo + Math.random() * (hi - lo));
  const pts = [];
  for (let k = 0; k < 2; k++)
    for (let i = 0; i < n; i++) pts.push([k * W + (i * W) / n, ys[i]]);
  pts.push([2 * W, ys[0]]);
  const P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M0 ${H} L0 ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1),
      p1 = P(i),
      p2 = P(i + 1),
      p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ` L${2 * W} ${H} Z`;
}
function waveSvg(cls, n, lo, hi) {
  const W = 1000,
    H = 40;
  return `<svg class="${cls}" viewBox="0 0 ${2 * W} ${H}" preserveAspectRatio="none"><path d="${wavePath(W, H, n, lo, hi)}"/></svg>`;
}
/* Drips are drawn in real pixels (no stretching) so the round tips stay round. */
function dripPath(W, H) {
  const base = 4;
  let d = `M0 0 L0 ${base}`;
  let x = 0;
  while (x < W) {
    const gap = rnd(30, 110);
    const w = rnd(26, 58);
    const len = rnd(H * 0.35, H * 0.95);
    const r = w * 0.32;
    const x0 = Math.min(x + gap, W),
      mid = x0 + w / 2,
      x1 = x0 + w;
    if (x1 > W) {
      d += ` L${W} ${base}`;
      break;
    }
    d += ` Q${(x + x0) / 2} ${base + rnd(-2, 4)} ${x0} ${base}`;
    d += ` C${x0 + w * 0.32} ${base} ${mid - r} ${len * 0.45} ${mid - r} ${len - r}`;
    d += ` A${r} ${r} 0 0 0 ${mid + r} ${len - r}`;
    d += ` C${mid + r} ${len * 0.45} ${x1 - w * 0.32} ${base} ${x1} ${base}`;
    x = x1;
  }
  return d + ` L${W} ${base} L${W} 0 Z`;
}
const bands = [...document.querySelectorAll(".band")];
bands.forEach((band) => {
  const w = document.createElement("div");
  w.className = "wave";
  w.setAttribute("aria-hidden", "true");
  w.style.setProperty("--d1", rndi(24, 36) + "s");
  w.style.setProperty("--d2", rndi(36, 52) + "s");
  w.innerHTML =
    waveSvg("back", rndi(3, 5), 2, 22) + waveSvg("front", rndi(4, 6), 12, 34);
  band.prepend(w);
  const dr = document.createElement("div");
  dr.className = "drips";
  dr.setAttribute("aria-hidden", "true");
  band.appendChild(dr);
});
let lastW = 0;
function drawDrips() {
  const W = Math.round(document.documentElement.clientWidth);
  if (W === lastW) return;
  lastW = W;
  document.querySelectorAll(".drips").forEach((dr) => {
    const H = Math.max(30, dr.getBoundingClientRect().height || 56);
    dr.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${dripPath(W, H)}"/></svg>`;
  });
}
drawDrips();
let rT;
addEventListener("resize", () => {
  clearTimeout(rT);
  rT = setTimeout(drawDrips, 150);
});

/* ===== Phone clock ===== */
function tick() {
  const now = new Date();
  const t = now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");
  document.querySelectorAll(".clock").forEach((c) => (c.textContent = t));
}
tick();
setInterval(tick, 30000);

/* ===== Active nav link ===== */
const navLinks = [...document.querySelectorAll(".nav-links a")];
const targets = navLinks.map((a) =>
  document.querySelector(a.getAttribute("href")),
);
function syncNav() {
  const y = 140;
  let idx = 0;
  targets.forEach((t, i) => {
    if (t && t.getBoundingClientRect().top <= y) idx = i;
  });
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4)
    idx = targets.length - 1;
  navLinks.forEach((a, i) => {
    a.classList.toggle("active", i === idx);
    if (i === idx) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
}
addEventListener("scroll", syncNav, { passive: true });
addEventListener("resize", syncNav);
syncNav();

update();
