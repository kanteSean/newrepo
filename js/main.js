/* =====================================================================
   MAISON LUMIÈRE — interactions
   ===================================================================== */
(() => {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  /* ---------------------------------------------------------------
     LOADER
     --------------------------------------------------------------- */
  const loader = $("#loader");
  const loaderBar = $("#loaderBar");
  let prog = 0;
  const tick = setInterval(() => {
    prog = Math.min(100, prog + Math.random() * 18);
    if (loaderBar) loaderBar.style.width = prog + "%";
    if (prog >= 100) { clearInterval(tick); finishLoad(); }
  }, 130);

  function finishLoad() {
    setTimeout(() => {
      loader && loader.classList.add("is-done");
      document.body.classList.remove("is-locked");
      startHeroReveal();
    }, 250);
  }
  document.body.classList.add("is-locked");
  window.addEventListener("load", () => { prog = Math.max(prog, 92); });

  /* ---------------------------------------------------------------
     HERO — reveal lines + video
     --------------------------------------------------------------- */
  function startHeroReveal() {
    $$(".hero .reveal-line").forEach((el, i) => {
      setTimeout(() => el.classList.add("is-in"), 120 * i);
    });
  }

  // attach hero video sources (fallback image stays if it fails)
  const heroVideo = $("#heroVideo");
  if (heroVideo && !reduceMotion) {
    const sources = [
      "https://videos.pexels.com/video-files/3209828/3209828-uhd_3840_2160_25fps.mp4",
      "https://videos.pexels.com/video-files/4252402/4252402-hd_1920_1080_25fps.mp4",
      "https://videos.pexels.com/video-files/3196036/3196036-uhd_2560_1440_25fps.mp4"
    ];
    let si = 0;
    const tryNext = () => {
      if (si >= sources.length) return;
      heroVideo.src = sources[si++];
      heroVideo.load();
      const p = heroVideo.play();
      if (p && p.catch) p.catch(() => {});
    };
    heroVideo.addEventListener("loadeddata", () => heroVideo.classList.add("is-ready"));
    heroVideo.addEventListener("error", tryNext);
    tryNext();
  }

  /* ---------------------------------------------------------------
     NAV — scroll state, mobile menu
     --------------------------------------------------------------- */
  const nav = $("#nav");
  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  const onScrollNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  const toggleMenu = (open) => {
    nav.classList.toggle("is-open", open);
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
  };
  burger.addEventListener("click", () => toggleMenu(!mobileMenu.classList.contains("is-open")));
  $$("#mobileMenu a").forEach(a => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------------------------------------------------------------
     AMBIENT LIGHT (mouse-responsive)
     --------------------------------------------------------------- */
  const amb = $("#ambientLight");
  if (amb && !reduceMotion) {
    let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      amb.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------------------------------------------
     PARTICLES (floating embers / spice motes)
     --------------------------------------------------------------- */
  const pc = $("#particles");
  if (pc && !reduceMotion) {
    const N = innerWidth < 760 ? 14 : 28;
    for (let i = 0; i < N; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      const size = 2 + Math.random() * 5;
      p.style.width = p.style.height = size + "px";
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDuration = 14 + Math.random() * 18 + "s";
      p.style.animationDelay = -Math.random() * 30 + "s";
      p.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
      pc.appendChild(p);
    }
  }

  /* ---------------------------------------------------------------
     SCROLL RAIL
     --------------------------------------------------------------- */
  const rail = $("#scrollRail");
  const onScrollRail = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    rail.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
  };
  onScrollRail();
  window.addEventListener("scroll", onScrollRail, { passive: true });

  /* ---------------------------------------------------------------
     REVEAL ON SCROLL
     --------------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal, .reveal-line").forEach(el => { if (!el.closest(".hero")) io.observe(el); });

  /* ---------------------------------------------------------------
     COUNTERS
     --------------------------------------------------------------- */
  $$("[data-count]").forEach(el => {
    const target = +el.dataset.count;
    const cio = new IntersectionObserver((ents) => {
      ents.forEach(en => {
        if (!en.isIntersecting) return;
        cio.disconnect();
        const dur = 1500, t0 = performance.now();
        (function step(t) {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    cio.observe(el);
  });

  /* ---------------------------------------------------------------
     TILT (3D hover on images)
     --------------------------------------------------------------- */
  if (!reduceMotion && matchMedia("(pointer:fine)").matches) {
    $$("[data-tilt]").forEach(el => {
      const max = 8;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) scale(1.02)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------------------------------------------------------------
     GALLERY PARALLAX
     --------------------------------------------------------------- */
  if (!reduceMotion) {
    const par = $$("[data-parallax]");
    const onPar = () => {
      const vh = innerHeight;
      par.forEach(el => {
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const off = (center - vh / 2) / vh;
        const img = el.querySelector("img");
        if (img) img.style.transform = `translateY(${off * (+el.dataset.parallax) * 120}px) scale(1.12)`;
      });
    };
    onPar();
    window.addEventListener("scroll", onPar, { passive: true });
  }

  /* ---------------------------------------------------------------
     JOURNEY — scroll-driven farm-to-plate + signature draw
     --------------------------------------------------------------- */
  const journeyData = [
    { i: "01", t: "From the soil", d: "Heirloom roots pulled at dawn, still cool with the earth that raised them.",
      bg: "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1600&q=80" },
    { i: "02", t: "Touched by fire", d: "Over white-hot binchōtan the larder becomes something elemental.",
      bg: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?auto=format&fit=crop&w=1600&q=80" },
    { i: "03", t: "The hands", d: "A pause of patience — tweezers, breath, and a steadiness learned over years.",
      bg: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80" },
    { i: "04", t: "The masterpiece", d: "Plated under candlelight — a memory you'll carry long after the last bite.",
      bg: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1600&q=80" }
  ];
  const jBg = $("#journeyBg"), jIndex = $("#journeyIndex"), jTitle = $("#journeyTitle"), jText = $("#journeyText");
  const sigEl = $("#journeySignature"), sigPath = $("#sigPath");
  let curStep = -1;
  function setStep(n) {
    if (n === curStep) return;
    curStep = n;
    const s = journeyData[n];
    if (jBg) { jBg.style.backgroundImage = `url('${s.bg}')`; jBg.style.transform = "scale(1.16)"; }
    if (jTitle) { jTitle.style.opacity = 0; jText.style.opacity = 0;
      setTimeout(() => {
        jIndex.textContent = s.i; jTitle.textContent = s.t; jText.textContent = s.d;
        jTitle.style.opacity = 1; jText.style.opacity = 1; jBg.style.transform = "scale(1.06)";
      }, 220);
    }
  }
  // preload journey bgs
  journeyData.forEach(s => { const im = new Image(); im.src = s.bg; });
  setStep(0);

  if (hasGSAP && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    $$(".journey__step").forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step, start: "top center", end: "bottom center",
        onEnter: () => setStep(i), onEnterBack: () => setStep(i)
      });
    });
    // signature draws across the journey
    ScrollTrigger.create({
      trigger: "#journey", start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: (self) => {
        const len = 1400;
        sigPath.style.strokeDashoffset = String(len * (1 - self.progress));
        sigEl.classList.toggle("is-signed", self.progress > 0.85);
      }
    });
  } else {
    // fallback: simple observers
    $$(".journey__step").forEach((step, i) => {
      new IntersectionObserver((e) => e[0].isIntersecting && setStep(i), { threshold: .5 }).observe(step);
    });
    if (sigPath) sigPath.style.strokeDashoffset = "0";
  }

  /* ---------------------------------------------------------------
     SIGNATURE (chef section) draw on reveal
     --------------------------------------------------------------- */
  const chefSign = $(".chef__sign");
  if (chefSign) new IntersectionObserver((e) => {
    if (e[0].isIntersecting) { chefSign.classList.add("is-signed"); }
  }, { threshold: .5 }).observe(chefSign);

  /* ---------------------------------------------------------------
     SIGNATURE DISHES — Three.js 3D plate
     --------------------------------------------------------------- */
  const dishes = [
    { course: "Course IV", name: "Ember Wagyu", desc: "Binchōtan-grilled wagyu, bone-marrow jus, charred allium ash and a whisper of smoked plum.", pair: "Paired · Barolo '16", price: "— 48", food: 0xc0703a, accent: 0x5a1f24 },
    { course: "Course II", name: "Golden Scallop", desc: "Hand-dived scallop seared in brown butter, saffron veil, citrus pearls and sea herbs.", pair: "Paired · Chablis '19", price: "— 36", food: 0xe9c27a, accent: 0xd9b06a },
    { course: "Course VI", name: "Burgundy Beet", desc: "Slow-roasted heirloom beet, aged balsamic, smoked ricotta and a dust of black garlic.", pair: "Paired · Pinot Noir", price: "— 28", food: 0x7a2630, accent: 0x5a1f24 },
    { course: "Course IX", name: "Molten Gold", desc: "Warm dark-chocolate sphere, gold leaf, burnt honey and a cloud of vanilla smoke.", pair: "Paired · Sauternes", price: "— 22", food: 0xb5832f, accent: 0xe9c27a }
  ];

  const dishNav = $("#dishNav");
  dishes.forEach((d, i) => {
    const li = document.createElement("li");
    li.textContent = d.name;
    li.className = i === 0 ? "is-active" : "";
    li.addEventListener("click", () => selectDish(i));
    dishNav.appendChild(li);
  });

  const copyEl = $(".dishes__copy");
  let activeDish = 0;
  function selectDish(i) {
    if (i === activeDish) return;
    activeDish = i;
    $$("#dishNav li").forEach((li, k) => li.classList.toggle("is-active", k === i));
    copyEl.classList.add("is-swapping");
    setTimeout(() => {
      const d = dishes[i];
      $("#dishCourse").textContent = d.course;
      $("#dishName").textContent = d.name;
      $("#dishDesc").textContent = d.desc;
      $("#dishPair").textContent = d.pair;
      $("#dishPrice").textContent = d.price;
      copyEl.classList.remove("is-swapping");
      if (buildPlate) buildPlate(d);
    }, 300);
  }

  let buildPlate = null;
  initDish3D();
  function initDish3D() {
    const canvas = $("#dishCanvas");
    if (!canvas || typeof THREE === "undefined") return;
    const stage = $("#dishStage");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 3.1, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    function resize() {
      const r = stage.getBoundingClientRect();
      const s = Math.max(1, Math.min(r.width, r.height));
      renderer.setSize(s, s, false);
      camera.aspect = 1; camera.updateProjectionMatrix();
    }

    // lights
    const key = new THREE.SpotLight(0xfff0d8, 1.5, 40, Math.PI / 5, 0.5, 1);
    key.position.set(4, 9, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const warm = new THREE.PointLight(0xe9c27a, 0.9, 30); warm.position.set(-5, 3, 3); scene.add(warm);
    const rim = new THREE.PointLight(0x5a1f24, 0.8, 30); rim.position.set(0, 2, -6); scene.add(rim);
    scene.add(new THREE.AmbientLight(0x3a2a20, 0.6));

    // mouse-tracking spotlight for lighting effect
    window.addEventListener("pointermove", (e) => {
      warm.position.x = (e.clientX / innerWidth - .5) * 12;
      warm.position.z = (e.clientY / innerHeight - .5) * -12 + 3;
    }, { passive: true });

    const group = new THREE.Group();
    scene.add(group);

    // plate
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.35, metalness: 0.4 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.5, 0.18, 64), plateMat);
    plate.receiveShadow = true; group.add(plate);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe9c27a, roughness: 0.25, metalness: 0.9 });
    const plateRim = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.05, 16, 80), rimMat);
    plateRim.rotation.x = Math.PI / 2; plateRim.position.y = 0.09; group.add(plateRim);

    let foodGroup = new THREE.Group(); group.add(foodGroup);

    buildPlate = (d) => {
      group.remove(foodGroup);
      foodGroup = new THREE.Group(); group.add(foodGroup);
      rimMat.color.setHex(0xe9c27a);

      const foodMat = new THREE.MeshStandardMaterial({ color: d.food, roughness: 0.45, metalness: 0.25 });
      const accentMat = new THREE.MeshStandardMaterial({ color: d.accent, roughness: 0.4, metalness: 0.35 });
      const garnishMat = new THREE.MeshStandardMaterial({ color: 0x6f8f4f, roughness: 0.7 });

      // central hero element
      const hero = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), foodMat);
      hero.position.y = 0.65; hero.castShadow = true; foodGroup.add(hero);

      // surrounding quenelles / drops
      const count = 6;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const rad = 1.55;
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.26 + (i % 2) * 0.08, 24, 24), i % 2 ? accentMat : foodMat);
        m.position.set(Math.cos(a) * rad, 0.32, Math.sin(a) * rad);
        m.castShadow = true; foodGroup.add(m);
      }
      // sauce ring
      const sauce = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.04, 12, 80), accentMat);
      sauce.rotation.x = Math.PI / 2; sauce.position.y = 0.12; foodGroup.add(sauce);
      // garnish sprigs
      for (let i = 0; i < 5; i++) {
        const g = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 8), garnishMat);
        const a = Math.random() * Math.PI * 2;
        g.position.set(Math.cos(a) * 0.6, 1.1, Math.sin(a) * 0.6);
        g.rotation.z = (Math.random() - .5) * 1.2; foodGroup.add(g);
      }
      // gold flecks
      const fleckMat = new THREE.MeshStandardMaterial({ color: 0xffe9b0, metalness: 1, roughness: 0.15, emissive: 0x3a2a10 });
      for (let i = 0; i < 8; i++) {
        const f = new THREE.Mesh(new THREE.TetrahedronGeometry(0.07), fleckMat);
        const a = Math.random() * Math.PI * 2, rr = Math.random() * 1.8;
        f.position.set(Math.cos(a) * rr, 0.3 + Math.random() * 0.9, Math.sin(a) * rr);
        foodGroup.add(f);
      }
    };
    buildPlate(dishes[0]);

    // drag to rotate
    let dragging = false, lastX = 0, vel = 0, autoTarget = 0;
    canvas.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; });
    window.addEventListener("pointerup", () => { dragging = false; });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      autoTarget += dx * 0.01; vel = dx * 0.01;
    });

    let visible = true;
    new IntersectionObserver((e) => visible = e[0].isIntersecting, { threshold: 0.05 }).observe(stage);

    resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize); ro.observe(stage);

    (function render() {
      requestAnimationFrame(render);
      if (!visible) return;
      if (!dragging) { autoTarget += reduceMotion ? 0 : 0.0035; }
      group.rotation.y += (autoTarget - group.rotation.y) * 0.08;
      foodGroup.children.forEach((c, i) => { c.position.y += Math.sin(performance.now() * 0.001 + i) * 0.0008; });
      group.position.y = Math.sin(performance.now() * 0.0008) * 0.05;
      renderer.render(scene, camera);
    })();
  }

  /* ---------------------------------------------------------------
     TESTIMONIALS carousel
     --------------------------------------------------------------- */
  const testi = [
    { q: "We came for dinner and left having lived an entire story. I have not stopped thinking about it.", a: "Eleanor V.", m: "Architecture Digest" },
    { q: "The closest thing to theatre I've eaten. Every course is a scene, every plate a confession.", a: "Marcus D.", m: "Food &amp; Wine" },
    { q: "Light, smoke, silence, then fire. Maison Lumière doesn't serve dinner — it composes it.", a: "Sofia R.", m: "Regular guest, since 2014" },
    { q: "Worth crossing a country for. The most memorable evening of our anniversary, by far.", a: "James & Aiko", m: "Private soirée" }
  ];
  const track = $("#testiTrack"), dotsWrap = $("#testiDots");
  testi.forEach((t, i) => {
    const slide = document.createElement("div");
    slide.className = "testimonials__slide";
    slide.innerHTML = `<div class="stars">★ ★ ★ ★ ★</div><blockquote>“${t.q}”</blockquote><cite>${t.a}<span>${t.m}</span></cite>`;
    track.appendChild(slide);
    const dot = document.createElement("button");
    dot.className = i === 0 ? "is-active" : "";
    dot.setAttribute("aria-label", `Testimonial ${i + 1}`);
    dot.addEventListener("click", () => goTesti(i, true));
    dotsWrap.appendChild(dot);
  });
  let ti = 0, tTimer;
  function goTesti(i, manual) {
    ti = (i + testi.length) % testi.length;
    track.style.transform = `translateX(-${ti * 100}%)`;
    $$("#testiDots button").forEach((d, k) => d.classList.toggle("is-active", k === ti));
    if (manual) restartTesti();
  }
  function restartTesti() { clearInterval(tTimer); tTimer = setInterval(() => goTesti(ti + 1), 5500); }
  restartTesti();

  /* ---------------------------------------------------------------
     RESERVATION form
     --------------------------------------------------------------- */
  const form = $("#reserveForm"), status = $("#reserveStatus");
  const dateInput = $("#r-date");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    $$(".field", form).forEach(f => {
      const inp = f.querySelector("input,select,textarea");
      if (inp && inp.required && !inp.value.trim()) { f.classList.add("invalid"); ok = false; }
      else f.classList.remove("invalid");
    });
    if (!ok) { status.textContent = "Please complete the highlighted fields."; status.style.color = "var(--copper)"; return; }
    const name = $("#r-name").value.split(" ")[0];
    status.style.color = "var(--gold)";
    status.textContent = "Securing your table…";
    form.querySelector("button").disabled = true;
    setTimeout(() => {
      status.innerHTML = `Thank you, ${name}. A candle awaits — we'll confirm by email shortly.`;
      form.reset();
      form.querySelector("button").disabled = false;
    }, 1400);
  });

  /* ---------------------------------------------------------------
     MAP pin nudge
     --------------------------------------------------------------- */
  const map = $("#map"), pin = $("#mapPin");
  if (map && pin && !reduceMotion) {
    map.addEventListener("pointermove", (e) => {
      const r = map.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      pin.style.transform = `translate(calc(-50% + ${px * 16}px), calc(-50% + ${py * 16}px))`;
    });
    map.addEventListener("pointerleave", () => { pin.style.transform = "translate(-50%,-50%)"; });
  }

  /* ---------------------------------------------------------------
     YEAR
     --------------------------------------------------------------- */
  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
})();
