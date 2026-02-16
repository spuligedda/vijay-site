(async () => {
  const heroTrack = document.getElementById("heroTrack");
  const heroDots = document.getElementById("heroDots");
  const heroPrev = document.getElementById("heroPrev");
  const heroNext = document.getElementById("heroNext");
  const heroSlider = document.getElementById("heroSlider");
  const heroProgress = document.getElementById("heroProgress");

  const blogsTrack = document.getElementById("blogsTrack");
  const songsTrack = document.getElementById("songsTrack");
  const spoofTrack = document.getElementById("spoofTrack");

  const blogPrev = document.getElementById("blogPrev");
  const blogNext = document.getElementById("blogNext");
  const songPrev = document.getElementById("songPrev");
  const songNext = document.getElementById("songNext");
  const spoofPrev = document.getElementById("spoofPrev");
  const spoofNext = document.getElementById("spoofNext");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCap = document.getElementById("lightboxCap");
  const lightboxClose = document.getElementById("lightboxClose");

  const navLinks = Array.from(document.querySelectorAll("nav a[href^='#']"));

  const escapeHtml = (s = "") =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function getYouTubeId(url = "") {
    try {
      const u = new URL(url);

      // youtu.be/<id>
      if (u.hostname.includes("youtu.be")) {
        return (u.pathname || "").replace("/", "").trim();
      }

      // youtube.com/watch?v=<id>
      if (u.searchParams.get("v")) return u.searchParams.get("v");

      // youtube.com/embed/<id>
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];

      // youtube.com/shorts/<id>
      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
    } catch {
      // ignore invalid URL
    }
    return "";
  }

  function ytThumb(url) {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  }

  function placeholderSVG(text = "Preview") {
    const label = String(text).slice(0, 30);
    return (
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop stop-color='#223355' offset='0'/>
            <stop stop-color='#4b2a7a' offset='1'/>
          </linearGradient>
        </defs>
        <rect width='100%' height='100%' fill='url(#g)'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
          fill='#dbe7ff' font-size='42' font-family='Arial'>${escapeHtml(label)}</text>
      </svg>
    `)
    );
  }

  function renderHero(images = []) {
    if (!heroTrack || !heroDots) return;

    if (!images.length) {
      heroTrack.innerHTML = `
        <div class="hero-slide active">
          <img src="${placeholderSVG("Add images in content.json")}" alt="placeholder" />
        </div>
      `;
      heroDots.innerHTML = "";
      return;
    }

    heroTrack.innerHTML = images
      .map((item, i) => {
        const rawUrl = item?.url || "";
        const isYouTube =
          String(item?.type || "").toLowerCase() === "youtube" ||
          /youtu\.?be|youtube\.com/i.test(rawUrl);

        if (isYouTube) {
          const id = getYouTubeId(rawUrl);
          if (!id) {
            return `
              <div class="hero-slide ${i === 0 ? "active" : ""}">
                <img src="${placeholderSVG("Invalid YouTube URL")}" alt="Invalid YouTube URL" />
                ${item?.caption ? `<div class="hero-caption">${escapeHtml(item.caption)}</div>` : ""}
              </div>
            `;
          }

          const embedUrl =
            `https://www.youtube.com/embed/${id}` +
            `?enablejsapi=1` +
            `&autoplay=${i === 0 ? 1 : 0}` +
            `&mute=1` +
            `&loop=1` +
            `&playlist=${id}` +
            `&rel=0` +
            `&modestbranding=1` +
            `&playsinline=1`;

          return `
            <div class="hero-slide ${i === 0 ? "active" : ""}">
              <div class="hero-media">
                <iframe
                  src="${embedUrl}"
                  title="${escapeHtml(item?.caption || "Vijay video")}"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>
              ${item?.caption ? `<div class="hero-caption">${escapeHtml(item.caption)}</div>` : ""}
            </div>
          `;
        }

        return `
          <div class="hero-slide ${i === 0 ? "active" : ""}">
            <img
              src="${escapeHtml(rawUrl)}"
              alt="${escapeHtml(item?.caption || `Vijay ${i + 1}`)}"
              loading="${i === 0 ? "eager" : "lazy"}"
            />
            ${item?.caption ? `<div class="hero-caption">${escapeHtml(item.caption)}</div>` : ""}
          </div>
        `;
      })
      .join("");

    heroDots.innerHTML = images
      .map(
        (_, i) =>
          `<button class="dot ${i === 0 ? "active" : ""}" aria-label="Slide ${i + 1}"></button>`
      )
      .join("");
  }

  function createCard(item, type = "blog", index = 0) {
    const safeTitle = escapeHtml(
      item?.title ||
        item?.caption ||
        (type === "song" ? `Song ${index + 1}` : `Item ${index + 1}`)
    );
    const safeMeta = escapeHtml(item?.meta || item?.source || item?.movie || "");

    let thumb = "";
    let action = "";
    let cardClass = "card";

    if (type === "song") {
      thumb = ytThumb(item?.url || "") || item?.thumbnail || "";
      const safeUrl = escapeHtml(item?.url || "#");
      action = `<a class="btn" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open YouTube</a>`;
    } else if (type === "blog") {
      thumb = item?.thumbnail || "";
      const safeUrl = escapeHtml(item?.url || "#");
      action = `<a class="btn" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open Blog</a>`;
    } else if (type === "spoof") {
      cardClass = "card spoof-card";
      thumb = item?.url || item?.thumbnail || "";
      const safeImg = escapeHtml(thumb || placeholderSVG("Spoof"));
      const safeCap = escapeHtml(item?.caption || item?.title || `Spoof ${index + 1}`);
      action = `<button class="btn alt" data-lightbox="1" data-img="${safeImg}" data-cap="${safeCap}">View Full</button>`;
    }

    const thumbSrc =
      thumb ||
      placeholderSVG(type === "song" ? "YouTube Song" : type === "blog" ? "Blog Link" : "Spoof");

    return `
      <article class="${cardClass}">
        <div class="thumb-wrap">
          <img src="${thumbSrc}" alt="${safeTitle}" loading="lazy" />
        </div>
        <div class="card-body">
          <h3>${safeTitle}</h3>
          <p class="meta">${safeMeta || "&nbsp;"}</p>
          ${action}
        </div>
      </article>
    `;
  }

  function setupTrackCarousel(trackEl, items, prevBtn, nextBtn, autoMs = 2800) {
    if (!trackEl || !prevBtn || !nextBtn) return null;

    trackEl.innerHTML = items.join("");

    let index = 0;
    let perView = getPerView();
    let maxIndex = Math.max(0, trackEl.children.length - perView);
    let timer = null;

    const windowEl = trackEl.closest(".carousel-window");

    function getPerView() {
      const w = window.innerWidth;
      if (w <= 620) return 1;
      if (w <= 980) return 2;
      return 3;
    }

    function slideWidth() {
      const first = trackEl.children[0];
      if (!first) return 0;
      const style = getComputedStyle(trackEl);
      const gap = parseFloat(style.gap || "0");
      return first.getBoundingClientRect().width + gap;
    }

    function go(i) {
      const pages = Math.max(1, maxIndex + 1);
      index = ((i % pages) + pages) % pages;
      const x = slideWidth() * index;
      trackEl.style.transform = `translateX(-${x}px)`;
    }

    function next() {
      go(index + 1);
    }

    function prev() {
      go(index - 1);
    }

    function recalc() {
      perView = getPerView();
      maxIndex = Math.max(0, trackEl.children.length - perView);
      if (index > maxIndex) index = 0;
      go(index);
    }

    function start() {
      if (!autoMs) return;
      stop();
      timer = setInterval(next, autoMs);
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    function restart() {
      stop();
      start();
    }

    prevBtn.addEventListener("click", () => {
      prev();
      restart();
    });

    nextBtn.addEventListener("click", () => {
      next();
      restart();
    });

    window.addEventListener("resize", recalc);

    if (windowEl) {
      windowEl.addEventListener("mouseenter", stop);
      windowEl.addEventListener("mouseleave", start);
      windowEl.addEventListener("touchstart", stop, { passive: true });
      windowEl.addEventListener("touchend", start, { passive: true });
    }

    recalc();
    start();

    return { next, prev, recalc, stop, start };
  }

  function setupHeroAuto(intervalMs = 9000) {
    if (!heroTrack || !heroDots || !heroPrev || !heroNext) return;

    const slides = Array.from(heroTrack.querySelectorAll(".hero-slide"));
    const dots = Array.from(heroDots.querySelectorAll(".dot"));
    if (!slides.length) return;

    let i = 0;
    let timer = null;
    let progressTimer = null;

    function setProgress(pct) {
      if (heroProgress) heroProgress.style.width = `${pct}%`;
    }

    function startProgress() {
      if (!heroProgress) return;
      clearInterval(progressTimer);

      let elapsed = 0;
      setProgress(0);

      const stepMs = 80;
      progressTimer = setInterval(() => {
        elapsed += stepMs;
        const pct = Math.min(100, (elapsed / intervalMs) * 100);
        setProgress(pct);
      }, stepMs);
    }

    function stopProgress() {
      clearInterval(progressTimer);
      progressTimer = null;
    }

    function ytCommand(iframe, func) {
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args: [] }),
        "*"
      );
    }

    function pauseAllVideos() {
      slides.forEach((s) => {
        const frame = s.querySelector("iframe");
        if (frame) ytCommand(frame, "pauseVideo");
      });
    }

    function playActiveVideoIfAny() {
      const activeFrame = slides[i]?.querySelector("iframe");
      if (!activeFrame) return;

      // Try play immediately, then retry once shortly after for API readiness
      ytCommand(activeFrame, "playVideo");
      setTimeout(() => ytCommand(activeFrame, "playVideo"), 450);
    }

    function show(n) {
      i = (n + slides.length) % slides.length;

      slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
      dots.forEach((d, idx) => d.classList.toggle("active", idx === i));

      pauseAllVideos();
      playActiveVideoIfAny();

      startProgress();
    }

    function next() {
      show(i + 1);
    }

    function prev() {
      show(i - 1);
    }

    function start() {
      stop();
      timer = setInterval(next, intervalMs);
      startProgress();
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      stopProgress();
    }

    function restart() {
      stop();
      start();
    }

    heroPrev.addEventListener("click", () => {
      prev();
      restart();
    });

    heroNext.addEventListener("click", () => {
      next();
      restart();
    });

    dots.forEach((d, idx) =>
      d.addEventListener("click", () => {
        show(idx);
        restart();
      })
    );

    if (heroSlider) {
      heroSlider.addEventListener("mouseenter", stop);
      heroSlider.addEventListener("mouseleave", start);
      heroSlider.addEventListener("touchstart", stop, { passive: true });
      heroSlider.addEventListener("touchend", start, { passive: true });
    }

    show(0);
    start();
  }

  function setupLightbox() {
    if (!lightbox || !lightboxImg || !lightboxCap || !lightboxClose) return;

    function open(src, cap) {
      lightboxImg.src = src;
      lightboxCap.textContent = cap || "";
      lightbox.classList.add("show");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }

    function close() {
      lightbox.classList.remove("show");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      lightboxImg.removeAttribute("src");
      lightboxCap.textContent = "";
    }

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lightbox='1']");
      if (btn) {
        const img = btn.getAttribute("data-img") || "";
        const cap = btn.getAttribute("data-cap") || "";
        open(img, cap);
      }
    });

    lightboxClose.addEventListener("click", close);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("show")) {
        close();
      }
    });
  }

  function setupNavSpy() {
    if (!navLinks.length) return;

    const sectionMap = new Map();

    navLinks.forEach((a) => {
      const id = a.getAttribute("href")?.slice(1);
      if (!id) return;
      const section = document.getElementById(id);
      if (section) sectionMap.set(section, a);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = sectionMap.get(entry.target);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: "-30% 0px -55% 0px"
      }
    );

    sectionMap.forEach((_, sectionEl) => observer.observe(sectionEl));
  }

  try {
    const res = await fetch("data/content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Unable to load data/content.json");
    const data = await res.json();

    const images = Array.isArray(data.images) ? data.images : [];
    const blogs = Array.isArray(data.blogs) ? data.blogs : [];
    const songsRaw = Array.isArray(data.songs) ? data.songs : [];

    // spoof fallback if not present
    const spoofRaw =
      Array.isArray(data.spoof) && data.spoof.length
        ? data.spoof
        : images.slice(0, 6).map((img, idx) => ({
            url: img.url,
            caption: img.caption || `Spoof ${idx + 1}`
          }));

    const songs = songsRaw.map((s, idx) => ({
      title: s.title || `Vijay Track ${idx + 1}`,
      meta: s.meta || "YouTube",
      url: s.url || "",
      thumbnail: s.thumbnail || ""
    }));

    renderHero(images);
    setupHeroAuto(9000);

    const spoofCards = spoofRaw.map((s, i) => createCard(s, "spoof", i));
    const blogCards = blogs.map((b, i) => createCard(b, "blog", i));
    const songCards = songs.map((s, i) => createCard(s, "song", i));

    setupTrackCarousel(spoofTrack, spoofCards, spoofPrev, spoofNext, 3100);
    setupTrackCarousel(blogsTrack, blogCards, blogPrev, blogNext, 3000);
    setupTrackCarousel(songsTrack, songCards, songPrev, songNext, 2600);

    setupLightbox();
    setupNavSpy();
  } catch (err) {
    console.error(err);
    const message = escapeHtml(err?.message || "Unknown error");

    if (heroTrack) {
      heroTrack.innerHTML = `
        <div class="hero-slide active">
          <img src="${placeholderSVG("Check content.json")}" alt="error" />
        </div>
      `;
    }
    if (heroDots) heroDots.innerHTML = "";

    const errorCard = `
      <article class="card">
        <div class="card-body">
          <h3>Data load error</h3>
          <p class="meta">${message}</p>
        </div>
      </article>
    `;

    if (spoofTrack) spoofTrack.innerHTML = errorCard;
    if (blogsTrack) blogsTrack.innerHTML = errorCard;
    if (songsTrack) songsTrack.innerHTML = errorCard;
  }
})();
