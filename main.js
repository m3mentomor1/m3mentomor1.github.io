/* =========================================================
   Global handlers (referenced by inline onclick attributes)
   ========================================================= */

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

let lastFocused = null;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  lastFocused = document.activeElement;
  modal.classList.add("is-open");
  document.documentElement.classList.add("modal-open");

  const gallery = modal.querySelector(".modal-gallery");
  if (gallery) {
    const firstThumb = gallery.querySelector("button[data-src]");
    if (firstThumb) selectGalleryImage(gallery.dataset.gallery, firstThumb);
  }

  const panel = modal.querySelector(".modal__panel");
  if (panel) panel.scrollTop = 0;
  const closeBtn = modal.querySelector(".modal__close");
  if (closeBtn) closeBtn.focus({ preventScroll: true });
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("is-open");
  if (!document.querySelector(".modal.is-open")) {
    document.documentElement.classList.remove("modal-open");
  }
  if (lastFocused && typeof lastFocused.focus === "function") {
    lastFocused.focus({ preventScroll: true });
  }
}

function selectGalleryImage(galleryId, thumbBtn) {
  const main = document.getElementById(`gallery-main-${galleryId}`);
  if (!main || !thumbBtn) return;
  main.src = thumbBtn.getAttribute("data-src");
  const gallery = thumbBtn.closest(".modal-gallery");
  gallery.querySelectorAll("button[data-src]").forEach((btn) => {
    btn.classList.toggle("is-active", btn === thumbBtn);
  });
}

function expandGalleryImage(btn) {
  const img = btn.parentElement.querySelector("img");
  if (!img) return;
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("image-lightbox-img");
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt || "Expanded image";
  lightbox.classList.add("is-open");
}

function closeImageLightbox() {
  document.getElementById("image-lightbox").classList.remove("is-open");
}

function scrollSlider(sliderId, direction) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;
  const card = Array.from(slider.children).find((c) => !c.hidden);
  if (!card) return;
  const gap = parseFloat(getComputedStyle(slider).columnGap) || 0;
  slider.scrollBy({
    left: direction * (card.offsetWidth + gap),
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

let toastTimer = 0;

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2400);
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (e) {
    ok = false;
  }
  ta.remove();
  return ok;
}

function copyText(text, message) {
  const done = () => showToast(message);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done, () => {
      if (fallbackCopy(text)) done();
    });
  } else if (fallbackCopy(text)) {
    done();
  }
}

function copyPhone() {
  copyText("639672376305", "Phone number copied to clipboard!");
}

function copyEmail() {
  copyText("sahagunshain.edu@proton.me", "Email copied to clipboard!");
}

/* =========================================================
   Page behaviour
   ========================================================= */

(() => {
  "use strict";

  window.__siteReady = true;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const wideMQ = window.matchMedia("(min-width: 900px)");
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const pad2 = (n) => String(n).padStart(2, "0");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const TOPBAR = 64;
  const hashStr = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const mulberry = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const confOf = (s) => (0.9 + (hashStr(s) % 9) / 100).toFixed(2);
  const MONO_FONT = '"Atkinson Hyperlegible Mono", ui-monospace, monospace';

  const sections = $$("main > section[id]");
  const routecard = $("#routecard");
  const routeLinks = $$(".routecard__list a", routecard);
  const routeItems = routeLinks.map((a) => a.parentElement);
  const stopNames = routeLinks.map((a) => $(".routecard__name", a).textContent.trim());
  const routeToggle = $("#route-toggle");
  const menuBtn = $("#menu-btn");
  const lightbox = $("#image-lightbox");
  const brandEl = $("#header-name");
  const topRight = $(".topbar__right");

  const popup = $("#popup");
  const popupBar = $(".popup__bar", popup);
  const popupBody = $("#popup-body");
  const popupIdx = $("#popup-idx");
  const popupCoords = $("#popup-coords");
  const prevBtn = $("#popup-prev");
  const nextBtn = $("#popup-next");
  const prevName = $("#popup-prev-name");
  const nextName = $("#popup-next-name");
  const nextDist = $("#popup-next-dist");
  const minBtn = $("#popup-min");
  const handleBtn = $("#popup-handle");
  const restoreBtn = $("#popup-restore");
  const restoreLabel = $("#popup-restore-label");

  /* ---------- Menu (route card on phones) ---------- */
  function setMenu(open) {
    routecard.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    root.classList.toggle("menu-open", open);
  }

  menuBtn.addEventListener("click", () => setMenu(!routecard.classList.contains("is-open")));
  $("#menu-close").addEventListener("click", () => setMenu(false));

  /* ---------- Modals & lightbox ---------- */
  $$(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeImageLightbox();
  });

  /* ---------- Missing images → survey placeholder ---------- */
  function markMissing(img) {
    if (img.dataset.missing) return;
    img.dataset.missing = "1";
    img.classList.add("img-missing");
    img.src = TRANSPARENT_PIXEL;
  }

  $$("img").forEach((img) => {
    if (img.closest(".lightbox")) return;
    // Large photos decode as their stop opens; keep that off the animation frames.
    img.decoding = "async";
    img.addEventListener("error", () => markMissing(img));
    img.addEventListener("load", () => {
      if (img.dataset.missing && img.src !== TRANSPARENT_PIXEL) {
        img.classList.remove("img-missing");
        delete img.dataset.missing;
      }
    });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) markMissing(img);
  });

  /* ---------- Photo mosaics: "+N" on the last visible tile ---------- */
  $$(".mosaic[data-max]").forEach((mosaic) => {
    const max = parseInt(mosaic.dataset.max, 10);
    const images = $$("img", mosaic);
    if (images.length <= max) return;
    images.slice(max).forEach((img) => (img.style.display = "none"));
    const last = images[max - 1];
    const wrapper = document.createElement("div");
    wrapper.className = "mosaic__more";
    wrapper.dataset.more = `+${images.length - max}`;
    last.parentNode.insertBefore(wrapper, last);
    wrapper.appendChild(last);
  });

  /* ---------- Project category counts ---------- */
  $$(".proj-cat").forEach((cat) => {
    const cards = $$(".pcard", cat);
    const count = $(".proj-cat__count", cat);
    if (count) count.textContent = `[${pad2(cards.length)}]`;
    cards.forEach((card, i) => card.style.setProperty("--i", i));
  });

  /* ---------- Reveal as items enter the popup's view ---------- */
  const revealItems = [];
  $$("[data-reveal]").forEach((group) => {
    Array.from(group.children).forEach((child) => {
      child.classList.add("reveal-item");
      revealItems.push(child);
    });
  });

  if ("IntersectionObserver" in window) {
    const itemIO = new IntersectionObserver(
      (entries) => {
        let k = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.style.setProperty("--i", Math.min(k++, 6));
          entry.target.classList.add("is-visible");
          itemIO.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.01 }
    );
    revealItems.forEach((el) => itemIO.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Carousels with scale-bar progress ---------- */
  const carousels = $$("[data-carousel]").map((el) => ({
    track: $(".track", el),
    bar: $(".scalebar", el),
    win: $(".scalebar__win", el),
    count: $(".car-count", el),
    prev: $('.car-btn[data-dir="-1"]', el),
    next: $('.car-btn[data-dir="1"]', el),
  }));

  const visibleCards = (track) => Array.from(track.children).filter((c) => !c.hidden);

  function buildSegments(c) {
    $$(".scalebar__seg", c.bar).forEach((s) => s.remove());
    const n = visibleCards(c.track).length;
    for (let i = 0; i < n; i++) {
      const seg = document.createElement("span");
      seg.className = "scalebar__seg";
      c.bar.insertBefore(seg, c.win);
    }
  }

  function updateCarousel(c) {
    const t = c.track;
    const cs = getComputedStyle(t);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const content = Math.max(1, t.scrollWidth - padL - padR);
    const max = Math.max(0, t.scrollWidth - t.clientWidth);
    const left = Math.min(Math.max(t.scrollLeft, 0), max);

    // Visible slice of the card strip (cards bleed to the popup edges).
    const start = Math.max(0, left - padL);
    const end = Math.min(content, left - padL + t.clientWidth);
    c.win.style.left = `${(start / content) * 100}%`;
    c.win.style.width = `${(Math.max(0, end - start) / content) * 100}%`;

    const cards = visibleCards(t);
    const n = cards.length;
    if (n && c.count) {
      const tr = t.getBoundingClientRect();
      let first = -1;
      let last = -1;
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const shown = Math.min(r.right, tr.right) - Math.max(r.left, tr.left);
        if (r.width && shown / r.width >= 0.6) {
          if (first < 0) first = i;
          last = i;
        }
      });
      if (first < 0) first = last = 0;
      c.count.textContent =
        last > first ? `${pad2(first + 1)}–${pad2(last + 1)} / ${pad2(n)}` : `${pad2(first + 1)} / ${pad2(n)}`;
    }
    if (c.prev) c.prev.disabled = left <= 2;
    if (c.next) c.next.disabled = left >= max - 2;
  }

  carousels.forEach((c) => {
    buildSegments(c);
    updateCarousel(c);
    let pending = false;
    c.track.addEventListener(
      "scroll",
      () => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          updateCarousel(c);
        });
      },
      { passive: true }
    );
  });

  /* ---------- Licenses filter tabs ---------- */
  const tabButtons = $$(".tab-btn");
  const licenseSlider = $("#slider-licenses");
  const licenseCarousel = carousels.find((c) => c.track === licenseSlider);

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      tabButtons.forEach((btn) => {
        const on = btn === button;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", String(on));
      });
      Array.from(licenseSlider.children).forEach((card) => {
        card.hidden = card.dataset.type !== filter;
      });
      licenseSlider.scrollLeft = 0;
      if (licenseCarousel) {
        buildSegments(licenseCarousel);
        updateCarousel(licenseCarousel);
      }
    });
  });

  /* ---------- Detection reticle (hover on cards) ---------- */
  const reticle = $("#reticle");
  const reticleTag = $(".reticle__tag", reticle);
  const confCache = new WeakMap();
  let target = null;
  let lastX = -1;
  let lastY = -1;
  let scrollTimer = 0;

  function confidence(el) {
    if (confCache.has(el)) return confCache.get(el);
    const value = (0.86 + (hashStr(el.textContent || "") % 14) / 100).toFixed(2);
    confCache.set(el, value);
    return value;
  }

  // The full padded box around `el`, plus the window [l, t, r, b] its scrolling
  // ancestors (popup body, carousel track, drawer) actually show.
  function detectionBox(el, p) {
    const r = el.getBoundingClientRect();
    const box = { x: r.left - p, y: r.top - p, w: r.width + 2 * p, h: r.height + 2 * p };
    const v = [0, 0, window.innerWidth, window.innerHeight];
    const inset = 4;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const ar = a.getBoundingClientRect();
      const cl = ar.left + a.clientLeft;
      const ct = ar.top + a.clientTop;
      const cr = cl + a.clientWidth;
      const cb = ct + a.clientHeight;
      if (a.scrollWidth > a.clientWidth + 8 || r.left < cl || r.right > cr) {
        v[0] = Math.max(v[0], cl + inset);
        v[2] = Math.min(v[2], cr - inset);
      }
      if (a.scrollHeight > a.clientHeight + 8 || r.top < ct || r.bottom > cb) {
        v[1] = Math.max(v[1], ct + inset);
        v[3] = Math.min(v[3], cb - inset);
      }
    }
    const shownW = Math.min(v[2], box.x + box.w) - Math.max(v[0], box.x);
    const shownH = Math.min(v[3], box.y + box.h) - Math.max(v[1], box.y);
    return shownW < 24 || shownH < 24 ? null : { ...box, v };
  }

  // The box keeps the object's full size; whatever falls outside the visible
  // window is masked, as if the object ran past the edge of the frame.
  function placeReticle(el, instant) {
    const box = detectionBox(el, 6);
    if (!box) {
      reticle.classList.remove("is-on");
      return false;
    }
    const [vl, vt, vr, vb] = box.v;
    const tagInside = box.y - 21 < Math.max(vt, TOPBAR + 6);
    const room = -40;
    const clip = [
      Math.max(vt - box.y, room),
      Math.max(box.x + box.w - vr, room),
      Math.max(box.y + box.h - vb, room),
      Math.max(vl - box.x, room),
    ];
    reticle.classList.toggle("is-instant", instant);
    reticle.classList.toggle("tag-inside", tagInside);
    reticle.style.transform = `translate(${box.x}px, ${box.y}px)`;
    reticle.style.width = `${box.w}px`;
    reticle.style.height = `${box.h}px`;
    reticle.style.clipPath = `inset(${clip.map((n) => `${n.toFixed(1)}px`).join(" ")})`;
    reticle.style.setProperty("--tag-x", `${Math.max(0, vl - box.x).toFixed(1)}px`);
    reticle.style.setProperty("--tag-y", `${Math.max(0, Math.max(vt, TOPBAR + 6) - box.y).toFixed(1)}px`);
    return true;
  }

  function setTarget(el) {
    if (el === target) return;
    const wasOn = !!target;
    target = el;
    if (!el) {
      reticle.classList.remove("is-on");
      return;
    }
    reticleTag.textContent = `${el.dataset.detect} ${confidence(el)}`;
    if (placeReticle(el, !wasOn || reduceMotion.matches)) reticle.classList.add("is-on");
  }

  function detectAt(x, y) {
    if (root.classList.contains("modal-open") || root.classList.contains("menu-open")) {
      setTarget(null);
      return;
    }
    const el = document.elementFromPoint(x, y);
    setTarget(el && el.closest ? el.closest("[data-detect]") : null);
  }

  if (finePointer.matches) {
    document.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        lastX = e.clientX;
        lastY = e.clientY;
        if (root.classList.contains("modal-open") || root.classList.contains("menu-open")) {
          setTarget(null);
          return;
        }
        const el = e.target && e.target.closest ? e.target.closest("[data-detect]") : null;
        setTarget(el);
      },
      { passive: true }
    );

    root.addEventListener("mouseleave", () => setTarget(null));

    document.addEventListener(
      "scroll",
      () => {
        if (target) setTarget(null);
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          if (lastX >= 0) detectAt(lastX, lastY);
        }, 140);
      },
      { capture: true, passive: true }
    );

    document.addEventListener(
      "toggle",
      () => {
        if (target) placeReticle(target, false);
      },
      true
    );
  }

  /* ---------- Shared: Perlin noise + marching squares ---------- */
  function makeNoise(seed) {
    const perm = new Uint8Array(512);
    const base = Array.from({ length: 256 }, (_, i) => i);
    const rand = mulberry(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = base[i & 255];

    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t, a, b) => a + t * (b - a);
    const grad = (h, x, y) => {
      switch (h & 7) {
        case 0: return x + y;
        case 1: return -x + y;
        case 2: return x - y;
        case 3: return -x - y;
        case 4: return x;
        case 5: return -x;
        case 6: return y;
        default: return -y;
      }
    };

    return (x, y) => {
      const xf = Math.floor(x);
      const yf = Math.floor(y);
      const X = xf & 255;
      const Y = yf & 255;
      const dx = x - xf;
      const dy = y - yf;
      const u = fade(dx);
      const v = fade(dy);
      const a = perm[X] + Y;
      const b = perm[X + 1] + Y;
      return lerp(
        v,
        lerp(u, grad(perm[a], dx, dy), grad(perm[b], dx - 1, dy)),
        lerp(u, grad(perm[a + 1], dx, dy - 1), grad(perm[b + 1], dx - 1, dy - 1))
      );
    };
  }

  function sampleField(noise, cols, rows, step, scale, ox = 0, oy = 0) {
    const field = new Float32Array(cols * rows);
    let min = Infinity;
    let max = -Infinity;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * step * scale + ox;
        const y = j * step * scale + oy;
        const v =
          noise(x, y) + 0.5 * noise(x * 2.03 + 11.1, y * 2.03 - 7.3) + 0.25 * noise(x * 4.1 - 3.7, y * 4.1 + 5.2);
        field[j * cols + i] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    return { field, min, max };
  }

  // Calls seg(x1, y1, x2, y2) for each contour segment of `field` at level L.
  function marchingSquares(field, cols, rows, step, L, seg) {
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = field[j * cols + i];
        const b = field[j * cols + i + 1];
        const c = field[(j + 1) * cols + i + 1];
        const d = field[(j + 1) * cols + i];
        const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;

        const x0 = i * step;
        const y0 = j * step;
        const x1 = x0 + step;
        const y1 = y0 + step;
        const tX = x0 + step * ((L - a) / (b - a));
        const rY = y0 + step * ((L - b) / (c - b));
        const bX = x0 + step * ((L - d) / (c - d));
        const lY = y0 + step * ((L - a) / (d - a));

        switch (idx) {
          case 1:
          case 14:
            seg(x0, lY, bX, y1);
            break;
          case 2:
          case 13:
            seg(bX, y1, x1, rY);
            break;
          case 3:
          case 12:
            seg(x0, lY, x1, rY);
            break;
          case 4:
          case 11:
            seg(tX, y0, x1, rY);
            break;
          case 5:
            seg(tX, y0, x1, rY);
            seg(x0, lY, bX, y1);
            break;
          case 6:
          case 9:
            seg(tX, y0, bX, y1);
            break;
          case 7:
          case 8:
            seg(tX, y0, x0, lY);
            break;
          case 10:
            seg(tX, y0, x0, lY);
            seg(bX, y1, x1, rY);
            break;
          default:
            break;
        }
      }
    }
  }

  // Corner-bracket box + label, the same language as the CSS detections.
  function drawDetection(ctx, x, y, w, h, label, color, onColor, tagBelow = false) {
    const l = Math.max(6, Math.min(14, Math.min(w, h) / 4));
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + l);
    ctx.lineTo(x, y);
    ctx.lineTo(x + l, y);
    ctx.moveTo(x + w - l, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + l);
    ctx.moveTo(x + w, y + h - l);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w - l, y + h);
    ctx.moveTo(x + l, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + h - l);
    ctx.stroke();
    if (label) {
      ctx.font = `500 10.5px ${MONO_FONT}`;
      const tw = ctx.measureText(label).width;
      const ty = tagBelow ? y + h : y >= 21 ? y - 19 : y;
      ctx.fillStyle = color;
      ctx.fillRect(x - 1, ty, tw + 12, 19);
      ctx.fillStyle = onColor;
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + 5, ty + 10);
    }
    ctx.restore();
  }

  const overlaps = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const noise = makeNoise(121774);

  /* =========================================================
     Full-page map — OpenStreetMap data for Quezon City
     ========================================================= */
  const mapview = $("#mapview");
  const geoWrap = $("#geomap");
  const geoBase = $("#geomap-base");
  const geoHi = $("#geomap-hi");
  const stopsLayer = $("#map-stops");
  const cursorEl = $("#map-cursor");
  const cursorTag = $(".cursor__tag", cursorEl);
  const followBtn = $("#map-follow");
  const coordsOut = $("#map-coords");
  const scaleBar = $("#map-scale-bar");
  const scaleLabel = $("#map-scale-label");
  const locatorEl = $(".locator", mapview);
  const locatorSvg = $("#locator-map");
  const mapbarEl = $(".mapbar", mapview);
  const progressBar = $("#route-progress");
  const progressText = $("#route-distance");

  const M_LAT = 110574;
  const ROAD_KIND = ["trunk", "primary", "secondary", "tertiary", "street"];
  const AREA_KIND = ["water", "park", "campus"];
  const ABBR = [
    [/\bAvenue\b/g, "Ave"],
    [/\bStreet\b/g, "St"],
    [/\bRoad\b/g, "Rd"],
    [/\bBoulevard\b/g, "Blvd"],
    [/\bExtension\b/g, "Ext"],
    [/\bHighway\b/g, "Hwy"],
  ];
  const DETECT_TARGETS = [
    { re: /^Elliptical Road$/, label: "landmark", source: "roads", conf: "0.98" },
    { re: /^University of the Philippines Diliman$/, label: "campus", source: "areas", conf: "0.96" },
    { re: /^Ateneo de Manila University$/, label: "campus", source: "areas", conf: "0.95" },
    { re: /^Ninoy Aquino Parks/, label: "park", source: "areas", conf: "0.94" },
  ];
  const STOP_SUBS = { 0: "Quezon City, Philippines", 1: "T.I.P. Quezon City" };
  // Gap between a stop marker and its popup (desktop).
  const GAP = 84;

  let geo = null;
  let mapStyle = null;
  const view = { w: window.innerWidth, h: window.innerHeight, k: 0, vx: 0, vy: 0, homeK: 0.18 };
  // ax/ay: where on screen the camera keeps the route cursor (eased toward the target anchor).
  const cam = { follow: true, d: 0, ax: null, ay: null, zoomAnim: false };
  const buffer = { canvas: document.createElement("canvas"), ctx: null, valid: false, lowres: false, k: 0, vx: 0, vy: 0, bw: 0, bh: 0 };
  const popSize = { w: 0, h: 0 };
  let baseCtx = null;
  let hiCtx = null;
  let stopEls = [];
  let stopD = [];
  let stopXY = [];
  let activeIdx = -1;
  let current = 0;
  let popupOpen = true;
  let traveling = false;
  let travelId = 0;
  let probeHit = null;
  let hovering = false;
  let frameQueued = false;
  let popPos = "";
  let popFlipped = false;
  const tileQueue = [];

  function readMapStyle() {
    mapStyle = {
      bg: css("--map-bg"),
      minor: css("--map-minor"),
      major: css("--map-major"),
      street: css("--map-street"),
      casing: css("--map-casing"),
      park: css("--map-park"),
      water: css("--map-water"),
      campus: css("--map-campus"),
      river: css("--map-river"),
      paper: css("--paper"),
      paper2: css("--paper-2"),
      paper3: css("--paper-3"),
      ink: css("--ink"),
      ink2: css("--ink-2"),
      signal: css("--signal"),
      onSignal: css("--on-signal"),
      contour: css("--contour-index"),
      contourMinor: css("--contour"),
    };
  }

  function decodeGeo(raw) {
    const [lat0, lon0] = raw.origin;
    const mLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
    const line = (arr, from) => {
      const n = (arr.length - from) / 2;
      const pts = new Float32Array(n * 2);
      let x = 0;
      let y = 0;
      for (let i = 0; i < n; i++) {
        x += arr[from + 2 * i];
        y += arr[from + 2 * i + 1];
        pts[2 * i] = x;
        pts[2 * i + 1] = y;
      }
      return pts;
    };
    const bbox = (p) => {
      let a = Infinity;
      let b = Infinity;
      let c = -Infinity;
      let d = -Infinity;
      for (let i = 0; i < p.length; i += 2) {
        const x = p[i];
        const y = p[i + 1];
        if (x < a) a = x;
        if (x > c) c = x;
        if (y < b) b = y;
        if (y > d) d = y;
      }
      return [a, b, c, d];
    };
    const nm = (i) => (i >= 0 ? raw.names[i] : "");

    const roads = raw.roads.map((r) => {
      const pts = line(r, 2);
      return { c: r[0], name: nm(r[1]), pts, bb: bbox(pts) };
    });
    const areas = (raw.areas || []).map((a) => {
      const pts = line(a, 2);
      return { k: a[0], name: nm(a[1]), pts, bb: bbox(pts) };
    });
    const rivers = (raw.rivers || []).map((r) => {
      const pts = line(r, 1);
      return { name: nm(r[0]), pts, bb: bbox(pts) };
    });

    const ext = [Infinity, Infinity, -Infinity, -Infinity];
    roads.forEach(({ bb }) => {
      ext[0] = Math.min(ext[0], bb[0]);
      ext[1] = Math.min(ext[1], bb[1]);
      ext[2] = Math.max(ext[2], bb[2]);
      ext[3] = Math.max(ext[3], bb[3]);
    });

    // Uniform grid of road segments for hover hit-testing.
    const CELL = 250;
    const grid = new Map();
    roads.forEach((r, ri) => {
      const p = r.pts;
      for (let i = 0; i < p.length - 2; i += 2) {
        const x0 = Math.floor(Math.min(p[i], p[i + 2]) / CELL);
        const x1 = Math.floor(Math.max(p[i], p[i + 2]) / CELL);
        const y0 = Math.floor(Math.min(p[i + 1], p[i + 3]) / CELL);
        const y1 = Math.floor(Math.max(p[i + 1], p[i + 3]) / CELL);
        for (let gx = x0; gx <= x1; gx++) {
          for (let gy = y0; gy <= y1; gy++) {
            const key = gx * 100000 + gy;
            let cell = grid.get(key);
            if (!cell) grid.set(key, (cell = []));
            cell.push(ri, i);
          }
        }
      }
    });

    let route = null;
    if (raw.route) {
      const pts = line(raw.route.pts, 0);
      const n = pts.length / 2;
      const cum = new Float32Array(n);
      for (let i = 1; i < n; i++) {
        cum[i] = cum[i - 1] + Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
      }
      route = { pts, cum, total: cum[n - 1], wp: raw.route.legs.map((i) => cum[i]) };
    }

    return { lat0, lon0, mLon, roads, areas, rivers, ext, grid, CELL, ph: raw.ph, route };
  }

  const toLatLon = (x, y) => [geo.lat0 + y / M_LAT, geo.lon0 + x / geo.mLon];
  const fmtLat = (lat, n = 5) => `${Math.abs(lat).toFixed(n)}° ${lat >= 0 ? "N" : "S"}`;
  const fmtLon = (lon, n = 5) => `${Math.abs(lon).toFixed(n)}° ${lon >= 0 ? "E" : "W"}`;
  const fmtKm = (m) => `${(m / 1000).toFixed(1)} km`;

  function pointAt(d) {
    const { pts, cum, total } = geo.route;
    const t = clamp(d, 0, total);
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= t) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo] || 1;
    const f = (t - cum[lo]) / seg;
    return [pts[2 * lo] + (pts[2 * hi] - pts[2 * lo]) * f, pts[2 * lo + 1] + (pts[2 * hi + 1] - pts[2 * lo + 1]) * f, lo];
  }

  // Draws the base map for an arbitrary viewport (map buffer and project tiles).
  function drawMap(c, v, opts = {}) {
    const s = mapStyle;
    const k = v.k;
    const cx = v.w / 2;
    const cy = v.h / 2;
    const X = (x) => (x - v.vx) * k + cx;
    const Y = (y) => cy - (y - v.vy) * k;
    const vb = [v.vx - cx / k, v.vy - cy / k, v.vx + cx / k, v.vy + cy / k];
    const inView = (bb) => bb[2] >= vb[0] && bb[0] <= vb[2] && bb[3] >= vb[1] && bb[1] <= vb[3];
    const zoomF = Math.sqrt(clamp(k / (opts.refK || view.homeK), 0.7, 2.4));

    const tracePath = (p, close) => {
      c.moveTo(X(p[0]), Y(p[1]));
      for (let i = 2; i < p.length; i += 2) c.lineTo(X(p[i]), Y(p[i + 1]));
      if (close) c.closePath();
    };

    [
      [2, s.campus],
      [1, s.park],
      [0, s.water],
    ].forEach(([kind, fill]) => {
      c.beginPath();
      geo.areas.forEach((a) => {
        if (a.k === kind && inView(a.bb)) tracePath(a.pts, true);
      });
      c.fillStyle = fill;
      c.fill();
    });

    c.lineJoin = "round";
    c.lineCap = "round";

    if (k >= 0.09) {
      c.beginPath();
      geo.roads.forEach((r) => {
        if (r.c === 4 && inView(r.bb)) tracePath(r.pts, false);
      });
      c.strokeStyle = s.street;
      c.lineWidth = 0.7 * zoomF;
      c.stroke();
    }

    c.beginPath();
    geo.rivers.forEach((r) => {
      if (inView(r.bb)) tracePath(r.pts, false);
    });
    c.strokeStyle = s.river;
    c.lineWidth = 1.6 * zoomF;
    c.stroke();

    const widths = [0, 1.4, 1.05, 0.7];
    for (let cls = 3; cls >= 1; cls--) {
      c.beginPath();
      geo.roads.forEach((r) => {
        if (r.c === cls && inView(r.bb)) tracePath(r.pts, false);
      });
      c.strokeStyle = cls <= 1 ? s.major : s.minor;
      c.lineWidth = widths[cls] * zoomF;
      c.stroke();
    }
    // Trunk roads drawn cased (double line), like a printed road map.
    c.beginPath();
    geo.roads.forEach((r) => {
      if (r.c === 0 && inView(r.bb)) tracePath(r.pts, false);
    });
    c.strokeStyle = s.casing;
    c.lineWidth = 3.8 * zoomF;
    c.stroke();
    c.strokeStyle = opts.fill || s.bg;
    c.lineWidth = 1.8 * zoomF;
    c.stroke();

    return { X, Y, vb, inView };
  }

  function roadLabel(name) {
    let n = name;
    ABBR.forEach(([re, rep]) => (n = n.replace(re, rep)));
    return n.toUpperCase();
  }

  function drawLabels(c, proj, w, h) {
    const s = mapStyle;
    const { X, Y, inView } = proj;
    const best = new Map();
    geo.roads.forEach((r) => {
      if (r.c > 2 || !r.name || !inView(r.bb)) return;
      const p = r.pts;
      for (let i = 0; i < p.length - 2; i += 2) {
        const x1 = X(p[i]);
        const y1 = Y(p[i + 1]);
        const x2 = X(p[i + 2]);
        const y2 = Y(p[i + 3]);
        const len = Math.hypot(x2 - x1, y2 - y1);
        const prev = best.get(r.name);
        if (!prev || len > prev.len) best.set(r.name, { len, x1, y1, x2, y2, c: r.c });
      }
    });

    c.font = `500 10px ${MONO_FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const boxes = [];
    const list = Array.from(best.entries()).sort((a, b) => a[1].c - b[1].c || b[1].len - a[1].len);
    for (const [name, sgm] of list) {
      if (boxes.length >= 36) break;
      const text = roadLabel(name);
      const tw = c.measureText(text).width + 6;
      if (sgm.len < tw + 20) continue;
      const mx = (sgm.x1 + sgm.x2) / 2;
      const my = (sgm.y1 + sgm.y2) / 2;
      if (mx < 10 || my < 10 || mx > w - 10 || my > h - 10) continue;
      const half = tw / 2 + 6;
      const box = [mx - half, my - half, mx + half, my + half];
      if (boxes.some((b) => overlaps(b, box))) continue;
      boxes.push(box);
      let a = Math.atan2(sgm.y2 - sgm.y1, sgm.x2 - sgm.x1);
      if (a > Math.PI / 2) a -= Math.PI;
      if (a < -Math.PI / 2) a += Math.PI;
      c.save();
      c.translate(mx, my);
      c.rotate(a);
      c.lineWidth = 3;
      c.strokeStyle = s.bg;
      c.lineJoin = "round";
      c.strokeText(text, 0, 0.5);
      c.fillStyle = s.ink2;
      c.fillText(text, 0, 0.5);
      c.restore();
    }
  }

  function sizeCanvas(cv, w, h, maxDpr = 2) {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return c;
  }

  // The base map is drawn into an oversized buffer that is slid and scaled
  // while the camera moves; it is only redrawn when it no longer covers the view.
  // While travelling, motion hides detail: draw at low resolution, sharpen on arrival.
  function renderBuffer() {
    const lowres = traveling;
    const m = Math.round(Math.max(view.w, view.h) * (lowres ? 0.45 : 0.32));
    const bw = view.w + 2 * m;
    const bh = view.h + 2 * m;
    const maxDpr = lowres ? 0.75 : Math.min(2, Math.sqrt(12e6 / (bw * bh)));
    buffer.ctx = sizeCanvas(buffer.canvas, bw, bh, maxDpr);
    buffer.ctx.clearRect(0, 0, bw, bh);
    const bv = { w: bw, h: bh, k: view.k, vx: view.vx, vy: view.vy };
    const proj = drawMap(buffer.ctx, bv);
    drawLabels(buffer.ctx, proj, bw, bh);
    Object.assign(buffer, { valid: true, lowres, k: view.k, vx: view.vx, vy: view.vy, bw, bh });
  }

  function bufferPlacement() {
    const s = view.k / buffer.k;
    const dw = buffer.bw * s;
    const dh = buffer.bh * s;
    const cx = (buffer.vx - view.vx) * view.k + view.w / 2;
    const cy = view.h / 2 - (buffer.vy - view.vy) * view.k;
    return { s, dw, dh, x: cx - dw / 2, y: cy - dh / 2 };
  }

  function compositeBase() {
    let p = buffer.valid ? bufferPlacement() : null;
    const needs =
      !p ||
      (!cam.zoomAnim && (buffer.k !== view.k || buffer.lowres)) ||
      p.s < 0.55 ||
      p.s > 1.9 ||
      p.x > 0 ||
      p.y > 0 ||
      p.x + p.dw < view.w ||
      p.y + p.dh < view.h;
    if (needs) {
      renderBuffer();
      p = bufferPlacement();
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rx = Math.round(p.x * dpr) / dpr;
    const ry = Math.round(p.y * dpr) / dpr;
    baseCtx.clearRect(0, 0, view.w, view.h);
    baseCtx.drawImage(buffer.canvas, rx, ry, p.dw, p.dh);
  }

  const X = (x) => (x - view.vx) * view.k + view.w / 2;
  const Y = (y) => view.h / 2 - (y - view.vy) * view.k;
  const screenToMeters = (sx, sy) => [view.vx + (sx - view.w / 2) / view.k, view.vy - (sy - view.h / 2) / view.k];

  function drawRoute(c, d) {
    const { pts } = geo.route;
    const [cx, cy, idx] = pointAt(d);
    const s = mapStyle;
    const trace = (from, to, startPt, endPt) => {
      c.beginPath();
      if (startPt) c.moveTo(X(startPt[0]), Y(startPt[1]));
      else c.moveTo(X(pts[2 * from]), Y(pts[2 * from + 1]));
      for (let i = from + 1; i <= to; i++) c.lineTo(X(pts[2 * i]), Y(pts[2 * i + 1]));
      if (endPt) c.lineTo(X(endPt[0]), Y(endPt[1]));
    };
    const last = pts.length / 2 - 1;

    c.lineJoin = "round";
    c.lineCap = "round";
    // Route still ahead: dashed
    trace(idx + 1, last, [cx, cy]);
    c.setLineDash([7, 6]);
    c.strokeStyle = s.ink;
    c.globalAlpha = 0.75;
    c.lineWidth = 2.4;
    c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;
    // Route travelled: solid, cased
    trace(0, idx, null, [cx, cy]);
    c.strokeStyle = s.paper2;
    c.lineWidth = 8;
    c.stroke();
    c.strokeStyle = s.signal;
    c.lineWidth = 4;
    c.stroke();
    return [cx, cy];
  }

  /* ----- Floating UI over the map (cached; invalidated when it changes) ----- */
  let uiCache = null;
  function uiRects() {
    if (uiCache) return uiCache;
    const rel = (el, pad = 8) => {
      if (!el || !el.getClientRects().length) return null;
      const r = el.getBoundingClientRect();
      return [r.left - pad, r.top - pad, r.right + pad, r.bottom + pad];
    };
    const wide = wideMQ.matches;
    uiCache = {
      routeRight: wide ? routecard.getBoundingClientRect().right : 0,
      list: [
        rel(brandEl),
        rel(topRight),
        wide ? rel(routecard) : null,
        rel(locatorEl),
        rel(mapbarEl),
        rel(followBtn),
        rel(restoreBtn),
      ].filter(Boolean),
    };
    return uiCache;
  }
  const invalidateUI = () => {
    uiCache = null;
  };

  /* ----- Detections on named landmarks, kept clear of the UI ----- */
  function drawLandmarks(c, obstacles) {
    if (!wideMQ.matches) return;
    const placed = [];
    DETECT_TARGETS.forEach((t) => {
      if (placed.length >= 2) return;
      if (!t.bb) {
        const pool = t.source === "roads" ? geo.roads : geo.areas;
        const feats = pool.filter((f) => t.re.test(f.name));
        if (!feats.length) return;
        t.bb = feats.reduce(
          (acc, f) => [Math.min(acc[0], f.bb[0]), Math.min(acc[1], f.bb[1]), Math.max(acc[2], f.bb[2]), Math.max(acc[3], f.bb[3])],
          [Infinity, Infinity, -Infinity, -Infinity]
        );
      }
      const x = X(t.bb[0]) - 6;
      const y = Y(t.bb[3]) - 6;
      const w = X(t.bb[2]) - X(t.bb[0]) + 12;
      const h = Y(t.bb[1]) - Y(t.bb[3]) + 12;
      if (w < 30 || h < 30 || w > view.w * 0.5) return;
      const box = [x, y - 21, x + w, y + h];
      if (box[0] < 4 || box[1] < 4 || box[2] > view.w - 4 || box[3] > view.h - 4) return;
      if (obstacles.some((o) => overlaps(o, box)) || placed.some((p) => overlaps(p, box))) return;
      placed.push(box);
      drawDetection(c, x, y, w, h, `${t.label} ${t.conf}`, mapStyle.signal, mapStyle.onSignal);
    });
  }

  /* ----- Hover "identify" tool ----- */
  function hitTest(sx, sy) {
    const [mx, my] = screenToMeters(sx, sy);
    const r = 8 / view.k;
    const C = geo.CELL;
    let best = null;
    let bestD = r;
    for (let gx = Math.floor((mx - r) / C); gx <= Math.floor((mx + r) / C); gx++) {
      for (let gy = Math.floor((my - r) / C); gy <= Math.floor((my + r) / C); gy++) {
        const cell = geo.grid.get(gx * 100000 + gy);
        if (!cell) continue;
        for (let q = 0; q < cell.length; q += 2) {
          const road = geo.roads[cell[q]];
          if (road.c === 4 && !road.name) continue;
          const p = road.pts;
          const i = cell[q + 1];
          const x1 = p[i];
          const y1 = p[i + 1];
          const dx = p[i + 2] - x1;
          const dy = p[i + 3] - y1;
          const len2 = dx * dx + dy * dy || 1;
          const t = clamp(((mx - x1) * dx + (my - y1) * dy) / len2, 0, 1);
          const d = Math.hypot(mx - (x1 + t * dx), my - (y1 + t * dy));
          if (d < bestD || (best && d <= bestD + 0.5 && road.c < best.c)) {
            bestD = d;
            best = road;
          }
        }
      }
    }
    if (best) return { type: "road", f: best };

    let area = null;
    geo.areas.forEach((a) => {
      if (mx < a.bb[0] || mx > a.bb[2] || my < a.bb[1] || my > a.bb[3]) return;
      const p = a.pts;
      let inside = false;
      for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
        if (p[i + 1] > my !== p[j + 1] > my && mx < ((p[j] - p[i]) * (my - p[i + 1])) / (p[j + 1] - p[i + 1]) + p[i]) {
          inside = !inside;
        }
      }
      const size = (a.bb[2] - a.bb[0]) * (a.bb[3] - a.bb[1]);
      if (inside && (!area || size < area.size)) area = { f: a, size };
    });
    return area ? { type: "area", f: area.f } : null;
  }

  function drawProbe(c) {
    if (!probeHit) return;
    const s = mapStyle;
    const { f, type } = probeHit;
    const p = f.pts;
    c.beginPath();
    c.moveTo(X(p[0]), Y(p[1]));
    for (let i = 2; i < p.length; i += 2) c.lineTo(X(p[i]), Y(p[i + 1]));
    if (type === "area") {
      c.closePath();
      c.fillStyle = s.signal;
      c.globalAlpha = 0.18;
      c.fill();
      c.globalAlpha = 1;
    }
    c.strokeStyle = s.signal;
    c.lineWidth = type === "road" ? 3 : 1.5;
    c.stroke();

    const x = Math.max(4, X(f.bb[0]) - 6);
    const y = Math.max(25, Y(f.bb[3]) - 6);
    const w = Math.min(view.w - 4, X(f.bb[2]) + 6) - x;
    const h = Math.min(view.h - 50, Y(f.bb[1]) + 6) - y;
    const kind = type === "road" ? ROAD_KIND[f.c] : AREA_KIND[f.k];
    drawDetection(c, x, y, w, h, `${kind} · ${f.name || "unnamed"}`, s.signal, s.onSignal);
  }

  /* ----- Stops ----- */
  function buildStops() {
    const n = sections.length;
    const { total, wp } = geo.route;
    const firstLeg = wp[1] || total * 0.3;
    const end = total * 0.965;
    stopD = sections.map((_, i) => {
      if (i === 0) return 0;
      if (i === 1) return firstLeg;
      return firstLeg + ((end - firstLeg) * (i - 1)) / (n - 2);
    });
    stopXY = stopD.map((d) => pointAt(d));

    stopEls = sections.map((sec, i) => {
      const a = document.createElement("a");
      a.className = "stop";
      a.href = `#${sec.id}`;
      a.tabIndex = -1;
      const label = document.createElement("span");
      label.className = "stop__label";
      const idx = document.createElement("span");
      idx.className = "stop__idx";
      idx.textContent = pad2(i);
      const name = document.createElement("span");
      name.textContent = stopNames[i];
      label.append(idx, name);
      if (STOP_SUBS[i]) {
        const wrap = document.createElement("span");
        wrap.append(name);
        const sub = document.createElement("span");
        sub.className = "stop__sub";
        sub.textContent = STOP_SUBS[i];
        wrap.append(sub);
        label.append(wrap);
      }
      const dot = document.createElement("span");
      dot.className = "stop__dot";
      a.append(dot, label);
      stopsLayer.appendChild(a);
      return a;
    });
    activeIdx = -1;

    $$("[data-stop-coords]").forEach((el) => {
      const i = parseInt(el.dataset.stopCoords, 10);
      const [lat, lon] = toLatLon(stopXY[i][0], stopXY[i][1]);
      el.textContent = `${fmtLat(lat, 4)} · ${fmtLon(lon, 4)}`;
    });
  }

  function setActive(idx) {
    if (idx === activeIdx) return;
    activeIdx = idx;
    routeLinks.forEach((a, i) => {
      a.classList.toggle("is-active", i === idx);
      a.classList.toggle("is-passed", i < idx);
      if (i === idx) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    routeItems.forEach((li, i) => li.classList.toggle("is-current", i === idx));
    stopEls.forEach((s, i) => {
      s.classList.toggle("is-active", i === idx);
      s.classList.toggle("is-passed", i < idx);
      s.classList.toggle("is-near", i === idx || i === idx + 1);
    });
    const tag = sections[idx].dataset.stopTag || sections[idx].id;
    cursorTag.textContent = `${tag} ${confOf(tag)}`;
  }

  function updateScaleBar() {
    const targetM = 90 / view.k;
    const pow = Math.pow(10, Math.floor(Math.log10(targetM)));
    const nice = [1, 2, 2.5, 5, 10].map((m) => m * pow).filter((m) => m <= targetM).pop() || pow;
    scaleBar.style.width = `${Math.round(nice * view.k)}px`;
    scaleLabel.textContent = nice >= 1000 ? `${nice / 1000} km` : `${nice} m`;
  }

  function buildLocator() {
    if (!locatorSvg || !geo.ph) return;
    const ns = "http://www.w3.org/2000/svg";
    locatorSvg.setAttribute("viewBox", geo.ph.viewBox);
    const land = document.createElementNS(ns, "path");
    land.setAttribute("d", geo.ph.path);
    land.setAttribute("class", "locator__land");
    const ext = document.createElementNS(ns, "rect");
    ext.setAttribute("class", "locator__extent");
    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", ((geo.lon0 * geo.ph.kx - geo.ph.minx) * geo.ph.scale).toFixed(2));
    dot.setAttribute("cy", ((-geo.lat0 - geo.ph.miny) * geo.ph.scale).toFixed(2));
    dot.setAttribute("r", "1.6");
    dot.setAttribute("class", "locator__dot");
    locatorSvg.append(land, ext, dot);
  }

  function updateLocator() {
    const ext = locatorSvg && $(".locator__extent", locatorSvg);
    if (!ext) return;
    const ph = geo.ph;
    const proj = (lat, lon) => [(lon * ph.kx - ph.minx) * ph.scale, (-lat - ph.miny) * ph.scale];
    const [lat1, lon1] = toLatLon(view.vx - view.w / 2 / view.k, view.vy + view.h / 2 / view.k);
    const [lat2, lon2] = toLatLon(view.vx + view.w / 2 / view.k, view.vy - view.h / 2 / view.k);
    const [x1, y1] = proj(lat1, lon1);
    const [x2, y2] = proj(lat2, lon2);
    const w = Math.max(5, x2 - x1);
    const h = Math.max(5, y2 - y1);
    ext.setAttribute("x", ((x1 + x2) / 2 - w / 2).toFixed(2));
    ext.setAttribute("y", ((y1 + y2) / 2 - h / 2).toFixed(2));
    ext.setAttribute("width", w.toFixed(2));
    ext.setAttribute("height", h.toFixed(2));
  }

  /* ----- Popup placement ----- */
  const popupWidth = () => popSize.w || clamp(window.innerWidth * 0.4, 420, 560);
  const popupShown = () => popupOpen && !traveling;

  // Screen point where the camera holds the route cursor.
  function anchorTarget() {
    const w = view.w;
    const h = view.h;
    const withPopup = popupOpen || traveling;
    if (wideMQ.matches) {
      if (!withPopup) return [w * 0.5, h * 0.48];
      const left = uiRects().routeRight + 24;
      const ax = Math.max(left + 70, Math.min(w * 0.36, w - 16 - popupWidth() - GAP));
      return [ax, (72 + h - 46) / 2];
    }
    if (!withPopup) return [w / 2, (58 + h - 70) / 2];
    const sheetTop = h - 8 - h * 0.56;
    return [w / 2, Math.max(58 + 50, (58 + sheetTop) / 2)];
  }

  // Desktop: the popup sits beside its marker (flipping sides and clamping to
  // the screen). Phones: it is a bottom sheet, positioned by CSS.
  function layoutPopup(mx, my) {
    const ph = popSize.h || popup.offsetHeight;
    if (!wideMQ.matches) return { x: 8, y: view.h - 8 - ph, w: view.w - 16, h: ph, side: 0 };
    const pw = popupWidth();
    const top = 72;
    const bottom = view.h - 62;
    const maxX = Math.max(16, view.w - 16 - pw);
    const leftBound = clamp(uiRects().routeRight + 16, 16, maxX);
    let side = 1;
    let x = mx + GAP;
    if (x > maxX && mx - GAP - pw >= leftBound) {
      x = mx - GAP - pw;
      side = -1;
    }
    x = Math.round(clamp(x, leftBound, maxX));
    const y = Math.round(clamp(my - ph * 0.3, top, Math.max(top, bottom - ph)));
    const pos = `translate(${x}px, ${y}px)`;
    if (pos !== popPos) {
      popPos = pos;
      popup.style.transform = pos;
    }
    if (popFlipped !== (side === -1)) {
      popFlipped = side === -1;
      popup.classList.toggle("is-flipped", popFlipped);
    }
    return { x, y, w: pw, h: ph, side };
  }

  // Leader line from the marker to its popup, like a detection annotation.
  function drawLeader(c, mx, my, p) {
    const s = mapStyle;
    c.save();
    c.strokeStyle = s.signal;
    c.fillStyle = s.signal;
    c.lineWidth = 1.5;
    if (!p.side) {
      const y1 = my + 30;
      const y2 = p.y - 10;
      if (y2 - y1 >= 14) {
        c.setLineDash([4, 4]);
        c.beginPath();
        c.moveTo(mx, y1);
        c.lineTo(mx, y2);
        c.stroke();
        c.setLineDash([]);
        c.fillRect(mx - 3, y2 - 3, 6, 6);
      }
    } else {
      const edge = p.side === 1 ? p.x - 8 : p.x + p.w + 8;
      const x0 = mx + p.side * 26;
      const x1 = x0 + p.side * 14;
      if ((edge - x1) * p.side >= 6) {
        const ey = clamp(my, p.y + 28, p.y + p.h - 28);
        c.beginPath();
        c.moveTo(x0, my);
        c.lineTo(x1, my);
        c.lineTo(edge, ey);
        c.stroke();
        c.fillRect(edge - 3, ey - 3, 6, 6);
        c.beginPath();
        c.arc(x0, my, 2.5, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }

  /* ----- Frame ----- */
  function frame() {
    frameQueued = false;
    if (!geo || !geo.route || !baseCtx) {
      if (popupShown()) {
        const [ax, ay] = anchorTarget();
        layoutPopup(ax, ay);
      }
      return;
    }
    const [cx, cy] = pointAt(cam.d);

    let settling = false;
    if (cam.follow) {
      const [tx, ty] = anchorTarget();
      if (cam.ax === null || reduceMotion.matches) {
        cam.ax = tx;
        cam.ay = ty;
      } else {
        cam.ax += (tx - cam.ax) * 0.2;
        cam.ay += (ty - cam.ay) * 0.2;
        if (Math.abs(tx - cam.ax) < 0.5 && Math.abs(ty - cam.ay) < 0.5) {
          cam.ax = tx;
          cam.ay = ty;
        } else {
          settling = true;
        }
      }
      view.vx = cx - (cam.ax - view.w / 2) / view.k;
      view.vy = cy + (cam.ay - view.h / 2) / view.k;
    }

    compositeBase();
    hiCtx.clearRect(0, 0, view.w, view.h);
    drawRoute(hiCtx, cam.d);
    const cxs = X(cx);
    const cys = Y(cy);

    cursorEl.style.transform = `translate(${cxs}px, ${cys}px)`;
    cursorEl.classList.toggle("is-tag-left", wideMQ.matches && (popupOpen || traveling) && !popFlipped);
    stopEls.forEach((el, i) => {
      const px = X(stopXY[i][0]);
      const py = Y(stopXY[i][1]);
      el.style.transform = `translate(${px}px, ${py}px)`;
      el.classList.toggle("is-left", px > view.w - 230 && px > view.w / 2);
    });

    const obstacles = uiRects().list.slice();
    obstacles.push([cxs - 40, cys - 60, cxs + 200, cys + 40]);
    if (popupShown()) {
      const mx = X(stopXY[current][0]);
      const my = Y(stopXY[current][1]);
      const p = layoutPopup(mx, my);
      drawLeader(hiCtx, mx, my, p);
      obstacles.push([p.x - 16, p.y - 16, p.x + p.w + 16, p.y + p.h + 16]);
    }
    drawLandmarks(hiCtx, obstacles);
    drawProbe(hiCtx);

    if (!hovering) {
      const [lat, lon] = toLatLon(cx, cy);
      coordsOut.textContent = `${fmtLat(lat)} · ${fmtLon(lon)}`;
    }
    progressBar.style.width = `${(cam.d / geo.route.total) * 100}%`;
    progressText.textContent = `${fmtKm(cam.d)} / ${fmtKm(geo.route.total)}`;
    updateScaleBar();
    updateLocator();

    if (settling) queueFrame();
  }

  function queueFrame() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(frame);
  }

  function resizeMap() {
    const w = mapview.clientWidth;
    const h = mapview.clientHeight;
    if (!w || !h) return;
    view.w = w;
    view.h = h;
    invalidateUI();
    if (!geo) {
      frame();
      return;
    }
    baseCtx = sizeCanvas(geoBase, w, h);
    hiCtx = sizeCanvas(geoHi, w, h);
    const prevHome = view.homeK;
    view.homeK = wideMQ.matches ? clamp(Math.min(w / 6400, h / 4000), 0.12, 0.22) : clamp(w / 2300, 0.12, 0.22);
    if (!view.k || view.k === prevHome) view.k = view.homeK;
    buffer.valid = false;
    cam.ax = null;
    frame();
  }

  function setFollow(on) {
    if (cam.follow === on) return;
    cam.follow = on;
    followBtn.hidden = on;
    invalidateUI();
  }

  // Re-attach the camera to the route cursor, gliding from where it is now.
  function engageFollow() {
    if (!cam.follow && geo && baseCtx) {
      const [cx, cy] = pointAt(cam.d);
      cam.ax = X(cx);
      cam.ay = Y(cy);
    }
    setFollow(true);
  }

  let settleTimer = 0;
  function zoomSettle() {
    cam.zoomAnim = true;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (traveling) return;
      cam.zoomAnim = false;
      queueFrame();
    }, 180);
  }

  const minK = () => view.homeK * 0.4;
  const maxK = () => view.homeK * 6;

  // While a popup is open, zoom about its marker so the popup stays put;
  // otherwise zoom about the pointer.
  function zoomAround(k1, sx, sy) {
    if (popupShown() && stopXY.length) {
      if (cam.follow) {
        view.k = k1;
        zoomSettle();
        queueFrame();
        return;
      }
      sx = X(stopXY[current][0]);
      sy = Y(stopXY[current][1]);
    }
    const [fx, fy] = screenToMeters(sx, sy);
    setFollow(false);
    view.k = k1;
    view.vx = fx - (sx - view.w / 2) / k1;
    view.vy = fy + (sy - view.h / 2) / k1;
    zoomSettle();
    queueFrame();
  }

  function animateTo(k1, focus) {
    const k0 = view.k;
    const [sx, sy] = focus || [view.w / 2, view.h / 2];
    const [fx, fy] = screenToMeters(sx, sy);
    const apply = (k) => {
      view.k = k;
      if (!cam.follow) {
        view.vx = fx - (sx - view.w / 2) / k;
        view.vy = fy + (sy - view.h / 2) / k;
      }
      frame();
    };
    if (reduceMotion.matches) {
      apply(k1);
      return;
    }
    cam.zoomAnim = true;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 280);
      const e = 1 - Math.pow(1 - t, 3);
      apply(k0 * Math.pow(k1 / k0, e));
      if (t < 1) requestAnimationFrame(step);
      else if (!traveling) {
        cam.zoomAnim = false;
        frame();
      }
    };
    requestAnimationFrame(step);
  }

  const zoomBy = (f) => {
    if (!geo) return;
    animateTo(clamp(view.k * f, minK(), maxK()));
  };

  function recenter() {
    engageFollow();
    if (geo) animateTo(view.homeK);
  }

  function bindMapEvents() {
    $("#map-zoom-in").addEventListener("click", () => zoomBy(1.6));
    $("#map-zoom-out").addEventListener("click", () => zoomBy(1 / 1.6));
    $("#map-reset").addEventListener("click", recenter);
    followBtn.addEventListener("click", recenter);

    const local = (e) => {
      const r = geoWrap.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };

    geoWrap.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        let dy = e.deltaY;
        if (e.deltaMode === 1) dy *= 16;
        else if (e.deltaMode === 2) dy *= view.h;
        const k1 = clamp(view.k * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0016)), minK(), maxK());
        if (k1 === view.k) return;
        const [sx, sy] = local(e);
        zoomAround(k1, sx, sy);
      },
      { passive: false }
    );

    // Pan with any pointer; pinch-zoom with two touches.
    const pointers = new Map();
    let drag = null;
    let pinch = null;

    const startDrag = (x, y) => {
      drag = { x, y, vx: view.vx, vy: view.vy, moved: false };
    };
    const startPinch = () => {
      const [a, b] = Array.from(pointers.values());
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, k0: view.k, at: screenToMeters(mid[0], mid[1]) };
      drag = null;
    };

    geoWrap.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest(".stop")) return;
      pointers.set(e.pointerId, local(e));
      try {
        geoWrap.setPointerCapture(e.pointerId);
      } catch (err) {
        /* pointer already released */
      }
      if (pointers.size === 1) startDrag(e.clientX, e.clientY);
      else if (pointers.size === 2) startPinch();
    });

    geoWrap.addEventListener("pointermove", (e) => {
      const [sx, sy] = local(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [sx, sy]);

      if (pinch && pointers.size >= 2) {
        const [a, b] = Array.from(pointers.values());
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const k = clamp((pinch.k0 * Math.hypot(a[0] - b[0], a[1] - b[1])) / pinch.d0, minK(), maxK());
        setFollow(false);
        view.k = k;
        view.vx = pinch.at[0] - (mid[0] - view.w / 2) / k;
        view.vy = pinch.at[1] + (mid[1] - view.h / 2) / k;
        zoomSettle();
        queueFrame();
        return;
      }

      if (e.pointerType === "mouse") {
        hovering = true;
        const [mx, my] = screenToMeters(sx, sy);
        const [lat, lon] = toLatLon(mx, my);
        coordsOut.textContent = `${fmtLat(lat)} · ${fmtLon(lon)}`;
      }

      if (drag && pointers.has(e.pointerId)) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        drag.moved = true;
        setFollow(false);
        geoWrap.classList.add("is-dragging");
        const e2 = geo.ext;
        view.vx = clamp(drag.vx - dx / view.k, e2[0], e2[2]);
        view.vy = clamp(drag.vy + dy / view.k, e2[1], e2[3]);
        probeHit = null;
        queueFrame();
        return;
      }

      if (e.pointerType !== "mouse" || !finePointer.matches) return;
      const hit = e.target.closest(".stop") ? null : hitTest(sx, sy);
      const changed = (hit && hit.f) !== (probeHit && probeHit.f);
      probeHit = hit;
      geoWrap.classList.toggle("is-probing", !!hit);
      if (changed) queueFrame();
    });

    const endPointer = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 1) {
        const [p] = Array.from(pointers.values());
        const r = geoWrap.getBoundingClientRect();
        startDrag(p[0] + r.left, p[1] + r.top);
      } else if (!pointers.size) {
        drag = null;
        geoWrap.classList.remove("is-dragging");
      }
    };
    geoWrap.addEventListener("pointerup", endPointer);
    geoWrap.addEventListener("pointercancel", endPointer);
    geoWrap.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      hovering = false;
      if (drag) return;
      probeHit = null;
      geoWrap.classList.remove("is-probing");
      queueFrame();
    });
    geoWrap.addEventListener("dblclick", (e) => {
      if (e.target.closest(".stop")) return;
      let [sx, sy] = local(e);
      const k1 = clamp(view.k * (e.shiftKey ? 0.5 : 2), minK(), maxK());
      if (popupShown() && stopXY.length) {
        if (cam.follow) {
          animateTo(k1);
          return;
        }
        sx = X(stopXY[current][0]);
        sy = Y(stopXY[current][1]);
      }
      setFollow(false);
      animateTo(k1, [sx, sy]);
    });
  }

  /* ---------- Project thumbnails: generated map tiles ---------- */
  function renderTile(el) {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return false;
    if (el.dataset.tile === "streets" && !geo) {
      if (!tileQueue.includes(el)) tileQueue.push(el);
      return true;
    }
    let cv = $("canvas", el);
    if (!cv) {
      cv = document.createElement("canvas");
      cv.setAttribute("aria-hidden", "true");
      el.appendChild(cv);
    }
    const c = sizeCanvas(cv, w, h);
    const s = mapStyle;
    const seed = hashStr(el.dataset.seed || "tile");
    const rand = mulberry(seed);
    const tag = el.dataset.tag || "feature";
    const conf = (0.88 + (seed % 11) / 100).toFixed(2);
    c.fillStyle = s.paper3;
    c.fillRect(0, 0, w, h);

    if (el.dataset.tile === "streets") {
      const majors = geo.roads.filter((r) => r.c <= 1 && r.pts.length >= 6);
      const pick = majors[Math.floor(rand() * majors.length)];
      const mid = Math.floor(pick.pts.length / 4) * 2;
      const tv = { w, h, k: 0.16, vx: pick.pts[mid], vy: pick.pts[mid + 1] };
      const proj = drawMap(c, tv, { refK: 0.2, fill: s.paper3 });
      const p = pick.pts;
      c.beginPath();
      c.moveTo(proj.X(p[0]), proj.Y(p[1]));
      for (let i = 2; i < p.length; i += 2) c.lineTo(proj.X(p[i]), proj.Y(p[i + 1]));
      c.strokeStyle = s.signal;
      c.lineWidth = 2.6;
      c.lineJoin = "round";
      c.stroke();
      const bw = w * 0.42;
      const bh = h * 0.46;
      drawDetection(c, w / 2 - bw / 2, h / 2 - bh / 2, bw, bh, `${tag} ${conf}`, s.signal, s.onSignal);
      const [lat, lon] = toLatLon(tv.vx, tv.vy);
      c.font = `500 10px ${MONO_FONT}`;
      c.fillStyle = s.ink2;
      c.textBaseline = "alphabetic";
      c.fillText(`${lat.toFixed(4)}° N  ${lon.toFixed(4)}° E`, 10, h - 10);
    } else {
      const step = 6;
      const cols = Math.ceil(w / step) + 1;
      const rows = Math.ceil(h / step) + 1;
      const ox = rand() * 200;
      const oy = rand() * 200;
      const { field, min, max } = sampleField(noise, cols, rows, step, 1 / 190, ox, oy);
      let peak = 0;
      let peakV = -Infinity;
      for (let j = Math.floor(rows * 0.3); j < rows * 0.75; j++) {
        for (let i = Math.floor(cols * 0.22); i < cols * 0.78; i++) {
          if (field[j * cols + i] > peakV) {
            peakV = field[j * cols + i];
            peak = j * cols + i;
          }
        }
      }
      const levels = 12;
      for (let k = 1; k < levels; k++) {
        const L = min + ((max - min) * k) / levels;
        c.beginPath();
        marchingSquares(field, cols, rows, step, L, (x1, y1, x2, y2) => {
          c.moveTo(x1, y1);
          c.lineTo(x2, y2);
        });
        c.strokeStyle = k % 5 === 0 ? s.contour : s.contourMinor;
        c.lineWidth = k % 5 === 0 ? 1.1 : 0.8;
        c.stroke();
      }
      const px = (peak % cols) * step;
      const py = Math.floor(peak / cols) * step;
      const bw = w * 0.34;
      const bh = h * 0.4;
      const bx = clamp(px - bw / 2, 10, w - bw - 10);
      const by = clamp(py - bh / 2, 24, h - bh - 10);
      drawDetection(c, bx, by, bw, bh, `${tag} ${conf}`, s.signal, s.onSignal);
      c.fillStyle = s.signal;
      c.fillRect(px - 2.5, py - 2.5, 5, 5);
    }
    el.dataset.drawn = "1";
    return true;
  }

  const tileEls = $$(".pcard__media[data-tile]");
  function watchTiles() {
    if (!("IntersectionObserver" in window)) {
      tileEls.forEach(renderTile);
      return;
    }
    const tileIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && renderTile(entry.target)) tileIO.unobserve(entry.target);
        });
      },
      { rootMargin: "200px 0px" }
    );
    tileEls.forEach((el) => tileIO.observe(el));
  }

  function redrawTiles() {
    tileEls.forEach((el) => {
      if (el.dataset.drawn) renderTile(el);
    });
  }

  /* =========================================================
     Stop navigation: travel along the route, then open the popup
     ========================================================= */
  function indexFromId(id) {
    if (!id) return null;
    let el = null;
    try {
      el = document.getElementById(decodeURIComponent(id));
    } catch (err) {
      el = null;
    }
    const sec = el && el.closest ? el.closest("main > section[id]") : null;
    return sec ? sections.indexOf(sec) : null;
  }

  const indexFromHash = () => indexFromId(location.hash.slice(1));

  function showSection(i) {
    if (target && popup.contains(target)) setTarget(null);
    sections.forEach((s, k) => {
      if (k !== i) s.classList.remove("is-current", "is-entered");
    });
    const sec = sections[i];
    if (!sec.classList.contains("is-current")) {
      sec.classList.add("is-current");
      void sec.offsetWidth;
      sec.classList.add("is-entered");
    }
    popupBody.scrollTop = 0;
    carousels.forEach((c) => {
      if (sec.contains(c.track)) updateCarousel(c);
    });
  }

  function updatePopupMeta(i) {
    const n = sections.length;
    const hasRoute = !!(geo && geo.route && stopD.length);
    popupIdx.textContent = pad2(i);
    popup.setAttribute("aria-label", `Stop ${pad2(i)}: ${stopNames[i]}`);
    if (hasRoute) {
      const [lat, lon] = toLatLon(stopXY[i][0], stopXY[i][1]);
      popupCoords.textContent = `${fmtLat(lat, 4)} · ${fmtLon(lon, 4)}`;
    }
    prevBtn.disabled = i === 0;
    prevName.textContent = i > 0 ? stopNames[i - 1] : "Start of route";
    const last = i === n - 1;
    nextName.textContent = stopNames[last ? 0 : i + 1];
    nextBtn.setAttribute("aria-label", last ? `Back to the start: ${stopNames[0]}` : `Next stop: ${stopNames[i + 1]}`);
    prevBtn.setAttribute("aria-label", i > 0 ? `Previous stop: ${stopNames[i - 1]}` : "Previous stop");
    nextDist.textContent = hasRoute
      ? `· ${fmtKm(last ? geo.route.total - stopD[i] : stopD[i + 1] - stopD[i])}`
      : "";
    restoreLabel.textContent = `Stop ${pad2(i)} · ${stopNames[i]}`;
  }

  function syncPopup() {
    const show = popupShown();
    if (!show && target && popup.contains(target)) setTarget(null);
    if (show && !popup.classList.contains("is-open")) {
      popSize.w = popup.offsetWidth;
      popSize.h = popup.offsetHeight;
      invalidateUI();
      frame();
    }
    popup.classList.toggle("is-open", show);
    root.classList.toggle("popup-open", show);
    restoreBtn.hidden = popupOpen || traveling;
    invalidateUI();
    queueFrame();
  }

  function setExpanded(on) {
    popup.classList.toggle("is-expanded", on);
    handleBtn.setAttribute("aria-expanded", String(on));
  }

  function minimizePopup() {
    popupOpen = false;
    setExpanded(false);
    syncPopup();
    restoreBtn.focus({ preventScroll: true });
  }

  function focusAfter(f) {
    if (!f) return;
    const el = f === "body" || f.disabled ? popupBody : f;
    el.focus({ preventScroll: true });
  }

  function arrive(i, opts) {
    traveling = false;
    current = i;
    setActive(i);
    showSection(i);
    updatePopupMeta(i);
    syncPopup();
    focusAfter(opts.focus);
  }

  function travel(i, opts) {
    const id = ++travelId;
    const from = cam.d;
    const loop = !!opts.loop;
    const to = loop ? geo.route.total : stopD[i];
    const dist = Math.abs(to - from);
    engageFollow();
    traveling = true;
    syncPopup();
    const k0 = view.k;
    const k1 = view.homeK;
    const z = clamp(dist / 7000, 0.08, 0.4);
    const dur = clamp(650 + dist * 0.13, 650, 2300);
    const t0 = performance.now();
    cam.zoomAnim = true;
    const step = (now) => {
      if (id !== travelId) return;
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      cam.d = from + (to - from) * e;
      view.k = k0 * Math.pow(k1 / k0, e) * (1 - z * Math.sin(Math.PI * t));
      frame();
      if (t < 1) {
        requestAnimationFrame(step);
        return;
      }
      cam.zoomAnim = false;
      if (loop) cam.d = 0;
      arrive(i, opts);
    };
    requestAnimationFrame(step);
  }

  function goTo(i, opts = {}) {
    if (i === null || i < 0 || i >= sections.length) return;
    if (routecard.classList.contains("is-open")) setMenu(false);
    if (opts.push !== false) {
      const hash = `#${sections[i].id}`;
      if (location.hash !== hash) history.pushState(null, "", hash);
    }
    popupOpen = true;
    if (i === current && !traveling) {
      engageFollow();
      syncPopup();
      focusAfter(opts.focus);
      return;
    }
    setActive(i);
    if (!geo || !geo.route || !baseCtx || reduceMotion.matches) {
      travelId++;
      if (geo && stopD.length) cam.d = stopD[i];
      cam.zoomAnim = false;
      if (geo) view.k = view.homeK || view.k;
      engageFollow();
      arrive(i, opts);
      return;
    }
    travel(i, opts);
  }

  const goNext = (focus) => {
    const last = sections.length - 1;
    if (activeIdx >= last) goTo(0, { loop: true, focus });
    else goTo(activeIdx + 1, { focus });
  };
  const goPrev = (focus) => {
    if (activeIdx > 0) goTo(activeIdx - 1, { focus });
  };

  prevBtn.addEventListener("click", () => goPrev(prevBtn));
  nextBtn.addEventListener("click", () => goNext(nextBtn));
  minBtn.addEventListener("click", minimizePopup);
  restoreBtn.addEventListener("click", () => goTo(current, { push: false, focus: "body" }));

  // Every in-page link to a section (route card, stop markers, brand) travels there.
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const i = indexFromId(a.getAttribute("href").slice(1));
    if (i === null) return;
    e.preventDefault();
    goTo(i, { focus: "body" });
  });

  window.addEventListener("popstate", () => {
    const i = indexFromHash();
    goTo(i === null ? 0 : i, { push: false });
  });

  function setRouteCollapsed(collapsed) {
    routecard.classList.toggle("is-collapsed", collapsed);
    routeToggle.setAttribute("aria-expanded", String(!collapsed));
    routeToggle.setAttribute("aria-label", collapsed ? "Expand route" : "Collapse route");
    invalidateUI();
    queueFrame();
  }

  routeToggle.addEventListener("click", () => setRouteCollapsed(!routecard.classList.contains("is-collapsed")));

  /* ----- Phone sheet: tap the handle or swipe the bar ----- */
  let swipe = null;
  let swipedAt = 0;
  handleBtn.addEventListener("click", () => {
    if (performance.now() - swipedAt < 400) return;
    setExpanded(!popup.classList.contains("is-expanded"));
  });
  popupBar.addEventListener("pointerdown", (e) => {
    if (wideMQ.matches || e.target.closest("#popup-min")) return;
    swipe = { y: e.clientY };
    try {
      popupBar.setPointerCapture(e.pointerId);
    } catch (err) {
      /* pointer already released */
    }
  });
  popupBar.addEventListener("pointerup", (e) => {
    if (!swipe) return;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dy) < 36) return;
    swipedAt = performance.now();
    if (dy < 0) setExpanded(true);
    else if (popup.classList.contains("is-expanded")) setExpanded(false);
    else minimizePopup();
  });
  popupBar.addEventListener("pointercancel", () => {
    swipe = null;
  });

  /* ----- Keyboard ----- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (lightbox.classList.contains("is-open")) {
        closeImageLightbox();
        return;
      }
      const open = $(".modal.is-open");
      if (open) {
        closeModal(open.id);
        return;
      }
      if (routecard.classList.contains("is-open")) {
        setMenu(false);
        return;
      }
      if (popup.classList.contains("is-expanded")) {
        setExpanded(false);
        return;
      }
      if (popupShown()) minimizePopup();
      return;
    }
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (root.classList.contains("modal-open") || root.classList.contains("menu-open")) return;
    if (lightbox.classList.contains("is-open")) return;
    const t = e.target;
    if (t && t.closest && t.closest("input, textarea, select, [contenteditable], .track")) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext(document.activeElement === nextBtn ? nextBtn : "body");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev(document.activeElement === prevBtn ? prevBtn : "body");
    } else if (e.key === "+" || e.key === "=") {
      zoomBy(1.6);
    } else if (e.key === "-" || e.key === "_") {
      zoomBy(1 / 1.6);
    }
  });

  /* ---------- Map bootstrapping ---------- */
  function initGeo() {
    const raw = window.GEO_DATA;
    if (!raw || !mapview) return;
    geo = decodeGeo(raw);
    readMapStyle();
    buildLocator();
    if (geo.route) {
      buildStops();
      setActive(current);
      cam.d = stopD[current];
      updatePopupMeta(current);
    }
    bindMapEvents();
    resizeMap();
    geoWrap.classList.add("is-ready");
    tileQueue.splice(0).forEach(renderTile);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        buffer.valid = false;
        invalidateUI();
        frame();
        redrawTiles();
      });
    }
  }

  function loadGeoData() {
    if (window.GEO_DATA) {
      initGeo();
      return;
    }
    const s = document.createElement("script");
    s.src = "map-data.js";
    s.async = true;
    s.onload = initGeo;
    document.head.appendChild(s);
  }

  /* ---------- Theme ---------- */
  // Light unless the visitor has switched to dark (remembered in localStorage).
  const themeBtn = $("#theme-btn");
  const themeColor = $('meta[name="theme-color"]');
  const isDark = () => root.getAttribute("data-theme") === "dark";

  function onThemeChange() {
    if (themeColor) themeColor.setAttribute("content", isDark() ? "#0E1012" : "#ECE9E1");
    readMapStyle();
    buffer.valid = false;
    if (geo) frame();
    redrawTiles();
  }

  themeBtn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      /* storage unavailable: theme still applies for this visit */
    }
    onThemeChange();
  });

  /* ---------- Global listeners ---------- */
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      popSize.w = popup.offsetWidth;
      popSize.h = popup.offsetHeight;
      queueFrame();
    }).observe(popup);
    new ResizeObserver(() => resizeMap()).observe(mapview);
  }

  wideMQ.addEventListener("change", () => {
    setMenu(false);
    setExpanded(false);
    invalidateUI();
    resizeMap();
  });

  let resizeTimer = 0;
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      carousels.forEach(updateCarousel);
      if (target) placeReticle(target, true);
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        redrawTiles();
      }
      invalidateUI();
      if (!("ResizeObserver" in window)) resizeMap();
      queueFrame();
    }, 160);
  });

  window.addEventListener("load", () => carousels.forEach(updateCarousel));

  /* ---------- Start ---------- */
  readMapStyle();
  const startIdx = indexFromHash();
  current = startIdx === null ? 0 : startIdx;
  root.classList.add("has-stops");
  setActive(current);
  showSection(current);
  updatePopupMeta(current);
  syncPopup();
  watchTiles();
  loadGeoData();
})();
