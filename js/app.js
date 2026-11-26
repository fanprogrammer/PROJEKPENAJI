/* =========================================================
   PENAJI (PENampungan Aspirasi HMJTI) - Interactive Prototype
   Note: Client-side prototype state (no external database)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // Sample initial aspiration rows for Prototype demonstration (F-11)
  const aspirationsData = [
    {
      id: 1,
      tanggal: "18 Nov 2026",
      pengirim: "Alfan Rizqy Prasetyo (E41261512)",
      prodi: "D-IV Teknik Informatika",
      kategori: "Sarana & Prasarana JTI",
      isi: "Mohon penambahan stop kontak dan peningkatan stabilitas akses Wi-Fi di ruang kelas lantai 3 Gedung JTI untuk mendukung praktikum pemrograman web.",
      status: "Diproses"
    },
    {
      id: 2,
      tanggal: "17 Nov 2026",
      pengirim: "Mahasiswa JTI (Anonim)",
      prodi: "D-III Manajemen Informatika",
      kategori: "Akademik & Perkuliahan",
      isi: "Diharapkan adanya sesi klinik coding atau bimbingan tambahan sebelum UTS/UAS untuk mata kuliah Algoritma dan Struktur Data.",
      status: "Selesai"
    },
    {
      id: 3,
      tanggal: "15 Nov 2026",
      pengirim: "Maulana Cannavaro H. (E41261333)",
      prodi: "D-IV Teknik Informatika",
      kategori: "Program Kerja HMJTI",
      isi: "Mengusulkan diadakan kompetisi UI/UX Design internal antar angkatan JTI sebelum seleksi lomba nasional tingkat politeknik.",
      status: "Diproses"
    },
    {
      id: 4,
      tanggal: "12 Nov 2026",
      pengirim: "Akbar Ramadani Putra P. (E41261282)",
      prodi: "D-IV Teknik Komputer",
      kategori: "Sarana & Prasarana JTI",
      isi: "Beberapa unit mikrokontroler dan kabel jumper di Lab Embedded System perlu peremajaan agar praktikum IoT berjalan lebih lancar.",
      status: "Menunggu"
    },
    {
      id: 5,
      tanggal: "10 Nov 2026",
      pengirim: "Mahasiswa JTI (Anonim)",
      prodi: "D-IV Bisnis Digital",
      kategori: "Layanan Kemahasiswaan",
      isi: "Informasi alur pengajuan surat dispensasi lomba mahasiswa mohon dirangkum dalam satu infografis resmi di Instagram HMJTI.",
      status: "Selesai"
    }
  ];

  const $ = (id) => document.getElementById(id);
  const successModal = $("successModal"), lightboxModal = $("lightboxModal");

  // Data aspirasi disimpan di browser (localStorage) agar progres tidak hilang saat refresh.
  const STORE_KEY = "penaji.aspirasi.v1";
  try {
    const st = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (Array.isArray(st) && st.length) { aspirationsData.length = 0; aspirationsData.push(...st); }
  } catch (e) {}
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(aspirationsData)); } catch (e) {} };

  const F = $("aspirasiForm"), anon = $("anonToggle"), inNama = $("inputNama"), inNim = $("inputNim"),
    sP = $("selectProdi"), sK = $("selectKategori"), ta = $("textareaAspirasi"), cc = $("charCounter");

  anon.addEventListener("change", () => {
    [inNama, inNim].forEach((i) => { i.disabled = anon.checked; if (anon.checked) i.value = ""; i.classList.remove("is-invalid"); });
    $("errNim").textContent = "";
  });
  ta.addEventListener("input", () => (cc.textContent = `${ta.value.length} / 500 karakter`));

  function setFieldError(el, errEl, msg) {
    el.classList.toggle("is-invalid", !!msg);
    errEl.textContent = msg || "";
    return !msg;
  }

  F.addEventListener("submit", (e) => {
    e.preventDefault();
    const nim = inNim.value.trim().toUpperCase(), name = inNama.value.trim();
    const ok = [
      setFieldError(sP, $("errProdi"), sP.value ? "" : "Program Studi wajib dipilih."),
      setFieldError(sK, $("errKategori"), sK.value ? "" : "Kategori aspirasi wajib dipilih."),
      setFieldError(inNim, $("errNim"), !nim || /^[A-Z0-9]{8,12}$/.test(nim) ? "" : "NIM terdiri dari 8–12 huruf atau angka, contoh E41261512."),
      setFieldError(ta, $("errAspirasi"), ta.value.trim().length >= 10 ? "" : "Isi aspirasi wajib diisi (minimal 10 karakter)."),
    ].every(Boolean);
    if (!ok) return;

    const M = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"], d = new Date();
    const pengirim = anon.checked || (!name && !nim) ? "Mahasiswa JTI (Anonim)" : name ? (nim ? `${name} (${nim})` : name) : `Mahasiswa JTI (${nim})`;
    aspirationsData.unshift({
      id: Date.now(),
      tanggal: `${String(d.getDate()).padStart(2, "0")} ${M[d.getMonth()]} ${d.getFullYear()}`,
      pengirim, prodi: sP.value, kategori: sK.value, isi: ta.value.trim(), status: "Menunggu",
    });
    save(); F.reset();
    [inNama, inNim].forEach((i) => (i.disabled = false));
    cc.textContent = "0 / 500 karakter";
    renderProgress();
    successModal.classList.remove("hidden");
  });

  $("closeSuccessModalBtn").addEventListener("click", () => successModal.classList.add("hidden"));
  $("viewInAdminBtn").addEventListener("click", () => { successModal.classList.add("hidden"); $("progres").scrollIntoView({ behavior: "smooth" }); });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ===== TAMPILAN PUBLIK: progres, hero, galeri, struktur, navbar, reveal =====
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal berulang: masuk viewport -> fade in + slide up (stagger), keluar viewport -> reset ke awal.
  const countUp = (el) => {
    const to = +el.dataset.count || 0;
    if (reduce || !to) { el.textContent = to; return; }
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 900, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  };
  const ioIn = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    e.target.querySelectorAll("[data-count]").forEach(countUp);
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  const ioOut = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) e.target.classList.remove("in"); }), { threshold: 0 });
  function observeAll(root = document) {
    root.querySelectorAll(".reveal").forEach((el) => {
      if (reduce) { el.classList.add("in"); return; }
      ioIn.observe(el); ioOut.observe(el);
    });
  }
  const stagger = (box, mod = 3) => [...box.children].forEach((c, i) => c.style.setProperty("--i", i % mod));

  // Progres aspirasi (dibaca dari data yang sama dengan form & panel admin)
  const LABEL = { Menunggu: ["Diterima", 1], Diproses: ["Diproses", 2], Selesai: ["Selesai", 3] };
  const mask = (p) => {
    if (/anonim/i.test(p)) return "Mahasiswa JTI (Anonim)";
    const w = p.replace(/\s*\(.*\)/, "").trim().split(/\s+/);
    return w[0] + (w.length > 1 ? " " + w.slice(1).map((x) => x[0].toUpperCase() + ".").join(" ") : "");
  };
  let pFilter = "all";
  function renderProgress() {
    const list = aspirationsData.filter((a) => pFilter === "all" || a.status === pFilter);
    const grid = $("progresGrid");
    grid.innerHTML = list.length ? list.map((a) => `
      <div class="reveal"><article class="pc">
        <div class="pc-top"><time>${escapeHtml(a.tanggal)}</time><span class="sp s-${a.status}">${LABEL[a.status][0]}</span></div>
        <span class="pc-cat">${escapeHtml(a.kategori)}</span>
        <p class="pc-txt">${escapeHtml(a.isi)}</p>
        <div class="pc-by"><b>${escapeHtml(mask(a.pengirim))}</b><span>${escapeHtml(a.prodi)}</span></div>
        <ol class="stp s${LABEL[a.status][1]}"><li>Diterima</li><li>Diproses</li><li>Selesai</li></ol>
      </article></div>`).join("") : `<p class="empty">Belum ada aspirasi dengan status ini.</p>`;
    stagger(grid); observeAll(grid);

    const hl = $("hlList");
    hl.innerHTML = aspirationsData.slice(0, 2).map((a, i) => `
      <a href="#progres" class="hl-i reveal" style="--i:${i + 3}">
        <div class="hl-t"><time>${escapeHtml(a.tanggal)}</time><span class="sp s-${a.status}">${LABEL[a.status][0]}</span></div>
        <b>${escapeHtml(a.kategori)}</b><p>${escapeHtml(a.isi)}</p></a>`).join("");
    observeAll(hl);

  }
  document.querySelectorAll("#progresFilters .fp").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("#progresFilters .fp").forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); pFilter = b.dataset.f; renderProgress();
  }));

  // Galeri carousel: tambah foto cukup dengan menambah satu objek ke array GALERI.
  const GALERI = [
    { img: "assets/galeri-1.jpg", t: "Sarasehan Mahasiswa & Civitas JTI", d: "Oktober 2026 • Gedung JTI Polije", tag: "Forum Aspirasi" },
    { img: "assets/galeri-2.jpg", t: "JTI Tech Fest & Hackathon 2026", d: "Oktober 2026 • Lab Rekayasa Perangkat Lunak", tag: "Teknologi" },
    { img: "assets/galeri-3.jpg", t: "Upgrading & Rapat Kerja Pengurus", d: "September 2026 • Politeknik Negeri Jember", tag: "Internal" },
    { img: "assets/galeri-4.jpg", t: "JTI Coding Camp & Pelatihan Web", d: "Agustus 2026 • Lab Pemrograman JTI", tag: "Edukasi" },
  ];
  const tr = $("galTrack"), prev = $("galPrev"), next = $("galNext");
  tr.innerHTML = GALERI.map((g, i) => `
    <div class="reveal"><button type="button" class="slide" data-i="${i}">
      <img src="${g.img}" alt="${escapeHtml(g.t)}" loading="lazy" draggable="false" />
      <span class="sl-ov"><em>${g.tag}</em><b>${escapeHtml(g.t)}</b><small>${g.d}</small></span>
    </button></div>`).join("");
  stagger(tr);
  const stepW = () => tr.querySelector(".slide").offsetWidth + 18;
  const edge = () => { prev.disabled = tr.scrollLeft < 4; next.disabled = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 4; };
  prev.addEventListener("click", () => tr.scrollBy({ left: -stepW(), behavior: "smooth" }));
  next.addEventListener("click", () => tr.scrollBy({ left: stepW(), behavior: "smooth" }));
  tr.addEventListener("scroll", edge, { passive: true }); addEventListener("resize", edge); edge();
  tr.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") next.click(); if (e.key === "ArrowLeft") prev.click(); });
  let down = false, sx = 0, sl = 0, moved = false;
  tr.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft; });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 5) { moved = true; tr.classList.add("drag"); }
    tr.scrollLeft = sl - dx;
  });
  addEventListener("pointerup", () => { down = false; tr.classList.remove("drag"); });
  tr.addEventListener("click", (e) => {
    const s = e.target.closest(".slide");
    if (!s) return;
    if (moved) { moved = false; return; }
    const g = GALERI[s.dataset.i];
    $("lightboxImg").src = g.img; $("lightboxImg").alt = g.t;
    $("lightboxTitle").textContent = g.t; $("lightboxDate").textContent = g.d;
    lightboxModal.classList.remove("hidden");
  });
  $("closeLightboxBtn").addEventListener("click", () => lightboxModal.classList.add("hidden"));
  lightboxModal.addEventListener("click", (e) => { if (e.target === lightboxModal) lightboxModal.classList.add("hidden"); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") [lightboxModal, successModal].forEach((m) => m.classList.add("hidden")); });

  // Struktur pengurus HMJTI (sumber: hmjtipolije2026.com/divisi)
  const BPH = [["Juliana Intan Purwaningtyas", "Ketua Himpunan"], ["ACH. Humaidi Aidil Kamal", "Wakil Ketua Himpunan"], ["Alya Rachma Kamila", "Sekretaris 1"], ["Nur Fitri Romadhan", "Sekretaris 2"], ["Agnees Serlita Anggun", "Bendahara 1"], ["Putri Amelia Balqis", "Bendahara 2"]];
  const DEP = [
    ["Administrasi", "Ahmad Maulana Febri Hananto", "Surat-menyurat, pengarsipan, dan pengelolaan keuangan organisasi."],
    ["Keilmuan", "Nur Arianti T", "Pelatihan, lokakarya, diskusi ilmiah, dan persiapan kompetisi."],
    ["Perhubungan", "Yuke Maia Chelci Dofir Nanda", "Hubungan dengan birokrasi kampus, alumni, dan organisasi lain."],
    ["Kominfo", "Muhammad Lukmanul Hakim", "Konten kreatif, publikasi, dan media sosial resmi."],
    ["Kewirausahaan", "Ovi Octa", "Usaha mandiri, merchandise resmi, dan pencarian dana."],
  ];
  const ini = (n) => n.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  $("bphGrid").innerHTML = BPH.map(([n, r]) => `<div class="reveal"><div class="pp"><span class="av">${ini(n)}</span><div><b>${n}</b><span>${r}</span></div></div></div>`).join("");
  $("depGrid").innerHTML = DEP.map(([d, n, t]) => `<div class="reveal"><div class="dp"><h4>${d}</h4><strong>${n}</strong><small>Kepala Departemen</small><p>${t}</p></div></div>`).join("");
  stagger($("bphGrid")); stagger($("depGrid"));

  // Navbar: state scroll, menu aktif (scrollspy), menu mobile
  const nav = $("topnav"), links = [...document.querySelectorAll(".tl")], mb = $("mobileMenuBtn");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 12);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const spy = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((l) => { const s = document.querySelector(l.getAttribute("href")); if (s) spy.observe(s); });
  mb.addEventListener("click", () => { const o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); });
  links.forEach((l) => l.addEventListener("click", () => { nav.classList.remove("open"); mb.setAttribute("aria-expanded", "false"); }));

  // Inisialisasi
  stagger($("heroLeft"), 5);
  document.querySelectorAll(".cta-glass-box, .footer-grid > *").forEach((el) => el.classList.add("reveal"));
  stagger(document.querySelector(".footer-grid"));
  renderProgress();
  observeAll();
});
