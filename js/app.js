(async () => {
    const heroTrack = document.getElementById("heroTrack");
    const heroDots = document.getElementById("heroDots");
    const heroPrev = document.getElementById("heroPrev");
    const heroNext = document.getElementById("heroNext");
  
    const blogsTrack = document.getElementById("blogsTrack");
    const songsTrack = document.getElementById("songsTrack");
  
    const blogPrev = document.getElementById("blogPrev");
    const blogNext = document.getElementById("blogNext");
    const songPrev = document.getElementById("songPrev");
    const songNext = document.getElementById("songNext");
  
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
        if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
        if (u.searchParams.get("v")) return u.searchParams.get("v");
        const parts = u.pathname.split("/");
        const embedIndex = parts.indexOf("embed");
        if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
      } catch {}
      return "";
    }
  
    function ytThumb(url) {
      const id = getYouTubeId(url);
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
    }
  
    // Generic thumbnail fetch (OpenGraph image via noembed where possible)
    // Fallback: gradient placeholder if not available
    async function enrichBlogThumbs(blogs) {
      const enriched = await Promise.all(
        blogs.map(async (b) => {
          if (b.thumbnail && b.thumbnail.trim()) return b;
          // Optional auto thumbnail for some providers:
          // For safety/simple reliability, keep fallback if no explicit thumbnail
          return { ...b, thumbnail: "" };
        })
      );
      return enriched;
    }
  
    function placeholderSVG(text = "Link Preview") {
      const t = encodeURIComponent(text.slice(0, 26));
      return `data:image/svg+xml;charset=UTF-8,` +
        encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'>
            <defs>
              <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
                <stop stop-color='#223355' offset='0'/>
                <stop stop-color='#4b2a7a' offset='1'/>
              </linearGradient>
            </defs>
            <rect width='100%' height='100%' fill='url(#g)'/>
            <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#dbe7ff' font-size='42' font-family='Arial'>${t}</text>
          </svg>`
        );
    }
  
    // HERO RENDER
    function renderHero(images = []) {
      if (!images.length) {
        heroTrack.innerHTML = `<div class="hero-slide active"><img src="${placeholderSVG("Add images in content.json")}" alt="placeholder"></div>`;
        return;
      }
      heroTrack.innerHTML = images.map((img, i) => `
        <div class="hero-slide ${i === 0 ? "active" : ""}">
          <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption || `Vijay ${i+1}`)}" loading="${i === 0 ? "eager" : "lazy"}" />
          ${img.caption ? `<div class="hero-caption">${escapeHtml(img.caption)}</div>` : ""}
        </div>
      `).join("");
  
      heroDots.innerHTML = images.map((_, i) => `<button class="dot ${i===0?"active":""}" aria-label="slide ${i+1}"></button>`).join("");
    }
  
    function createCard(item, type = "blog") {
      const thumb = type === "song"
        ? (ytThumb(item.url) || item.thumbnail || "")
        : (item.thumbnail || "");
  
      const thumbSrc = thumb || placeholderSVG(type === "song" ? "YouTube Song" : "Blog Link");
      const title = escapeHtml(item.title || (type === "song" ? "Song" : "Blog"));
      const meta = escapeHtml(item.meta || (type === "song" ? (item.movie || "") : (item.source || "")));
      const url = escapeHtml(item.url || "#");
  
      return `
        <article class="card">
          <div class="thumb-wrap">
            <img src="${thumbSrc}" alt="${title}" loading="lazy" />
          </div>
          <div class="card-body">
            <h3>${title}</h3>
            <p class="meta">${meta || "&nbsp;"}</p>
            <a class="btn" href="${url}" target="_blank" rel="noopener noreferrer">
              Open ${type === "song" ? "YouTube" : "Blog"}
            </a>
          </div>
        </article>
      `;
    }
  
    function setupTrackCarousel(trackEl, items, prevBtn, nextBtn, autoMs = 2800) {
      trackEl.innerHTML = items.join("");
  
      let index = 0;
      let perView = getPerView();
      let maxIndex = Math.max(0, trackEl.children.length - perView);
      let timer = null;
  
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
        index = (i + maxIndex + 1) % (maxIndex + 1 || 1);
        const x = slideWidth() * index;
        trackEl.style.transform = `translateX(-${x}px)`;
      }
  
      function next() { go(index + 1); }
      function prev() { go(index - 1); }
  
      function recalc() {
        perView = getPerView();
        maxIndex = Math.max(0, trackEl.children.length - perView);
        if (index > maxIndex) index = 0;
        go(index);
      }
  
      function start() { timer = setInterval(next, autoMs); }
      function stop() { if (timer) clearInterval(timer); timer = null; }
      function restart() { stop(); start(); }
  
      prevBtn.addEventListener("click", () => { prev(); restart(); });
      nextBtn.addEventListener("click", () => { next(); restart(); });
      window.addEventListener("resize", recalc);
  
      recalc();
      start();
  
      return { next, prev, recalc };
    }
  
    function setupHeroAuto() {
      const slides = Array.from(heroTrack.querySelectorAll(".hero-slide"));
      const dots = Array.from(heroDots.querySelectorAll(".dot"));
      if (!slides.length) return;
  
      let i = 0;
      let timer = null;
  
      function show(n) {
        i = (n + slides.length) % slides.length;
        slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
        dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
      }
  
      function next() { show(i + 1); }
      function prev() { show(i - 1); }
  
      heroPrev.addEventListener("click", () => { prev(); restart(); });
      heroNext.addEventListener("click", () => { next(); restart(); });
      dots.forEach((d, idx) => d.addEventListener("click", () => { show(idx); restart(); }));
  
      function start() { timer = setInterval(next, 3200); }
      function stop() { if (timer) clearInterval(timer); timer = null; }
      function restart() { stop(); start(); }
  
      show(0);
      start();
    }
  
    // Load data
    try {
      const res = await fetch("data/content.json");
      if (!res.ok) throw new Error("Unable to load data/content.json");
      const data = await res.json();
  
      const images = data.images || [];
      const blogsRaw = data.blogs || [];
      const songs = data.songs || [];
  
      const blogs = await enrichBlogThumbs(blogsRaw);
  
      renderHero(images);
      setupHeroAuto();
  
      const blogCards = blogs.map(b => createCard(b, "blog"));
      const songCards = songs.map(s => createCard(s, "song"));
  
      setupTrackCarousel(blogsTrack, blogCards, blogPrev, blogNext, 3000);
      setupTrackCarousel(songsTrack, songCards, songPrev, songNext, 2600);
  
    } catch (err) {
      console.error(err);
      heroTrack.innerHTML = `<div class="hero-slide active"><img src="${placeholderSVG("Check content.json")}" alt="error"></div>`;
      blogsTrack.innerHTML = `<article class="card"><div class="card-body"><h3>Data load error</h3><p class="meta">${escapeHtml(err.message)}</p></div></article>`;
      songsTrack.innerHTML = `<article class="card"><div class="card-body"><h3>Data load error</h3><p class="meta">${escapeHtml(err.message)}</p></div></article>`;
    }
  })();
  