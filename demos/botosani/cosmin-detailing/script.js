/* =====================================================================
   LimeSpark — Local Business Template · engine
   Loads tokens.json + content.json, applies tokens as CSS variables,
   renders every section from data, and wires up interactions.
   No dependencies. No build step.
   ===================================================================== */

(() => {
  'use strict';

  /* ---------- tiny helpers ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  // safely read a nested path like "hero.primaryCta.label"
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- inline icon set (stroke-based, minimal) ---------- */
  const ICONS = {
    sparkle: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
    shine:   '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    layers:  '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 16l9 5 9-5"/>',
    shield:  '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
    film:    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4"/>',
    wheel:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    leaf:    '<path d="M11 20A7 7 0 019 6c3-3 9-3 12-3 0 3 0 9-3 12a7 7 0 01-7 5z"/><path d="M9 15c1.5-3 4-5.5 7-7"/>',
    medal:   '<circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/><path d="M12 6v3l2 1"/>',
    camera:  '<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    heart:   '<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 018-3 4.5 4.5 0 018 3c-2 4.5-9 9-9 9z"/>',
    phone:   '<path d="M5 4h4l1 5-2 1a12 12 0 006 6l1-2 5 1v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    mail:    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    pin:     '<path d="M12 21c4-4 7-7.5 7-11a7 7 0 10-14 0c0 3.5 3 7 7 11z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.sparkle}</svg>`;
  const stars = (n = 5) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);

  /* ---------- 1. TOKENS → CSS variables ---------- */
  function applyTokens(tokens) {
    const root = document.documentElement;
    // groups that map to --<group>-<key>. Skip meta/schema keys.
    const skip = new Set(['meta', '$schema']);
    for (const [group, values] of Object.entries(tokens)) {
      if (skip.has(group) || typeof values !== 'object') continue;
      for (const [key, val] of Object.entries(values)) {
        if (typeof val === 'object') continue;
        root.style.setProperty(`--${group}-${key}`, String(val));
      }
    }
  }

  /* ---------- WhatsApp / phone link builders ---------- */
  let CONTENT = {};
  function waLink(message) {
    const number = get(CONTENT, 'business.whatsapp') || '';
    const text = encodeURIComponent(message || get(CONTENT, 'whatsappDefaultMessage') || '');
    return `https://wa.me/${number}?text=${text}`;
  }
  function telLink() { return `tel:${(get(CONTENT, 'business.phone') || '').replace(/\s+/g, '')}`; }

  // resolve a CTA object {label, action|href} to an href
  function ctaHref(cta) {
    if (!cta) return '#';
    if (cta.action === 'whatsapp') return waLink(get(CONTENT, 'contact.whatsappMessage'));
    if (cta.action === 'phone') return telLink();
    return cta.href || '#';
  }
  // only truly external links (WhatsApp / http) open in a new tab.
  // internal anchors like "#rezultate" must stay same-tab so they smooth-scroll.
  function isExternalCta(cta) {
    return cta.action === 'whatsapp' || /^https?:\/\//i.test(cta.href || '');
  }
  // wire an <a> to a CTA: label, href, and new-tab behaviour
  function applyCta(node, cta) {
    if (!node || !cta) return;
    if (cta.label != null) node.textContent = cta.label;
    node.href = ctaHref(cta);
    if (isExternalCta(cta)) { node.target = '_blank'; node.rel = 'noopener'; }
    else { node.removeAttribute('target'); node.removeAttribute('rel'); }
  }

  /* ---------- 2. bind simple [data-content] text & attrs ---------- */
  function bindStatic() {
    // page title (special)
    const biz = get(CONTENT, 'business') || {};
    const fullName = [biz.name, biz.nameSuffix].filter(Boolean).join(' ');
    $$('[data-content]').forEach((node) => {
      const path = node.dataset.content;
      let val = path === '__title'
        ? `${fullName} — ${biz.tagline || ''}`
        : get(CONTENT, path);
      if (val == null) return;
      if (node.hasAttribute('data-content-attr')) node.setAttribute(node.dataset.contentAttr, val);
      else node.textContent = val;
    });
    // src / alt binders
    $$('[data-content-src]').forEach((n) => { const v = get(CONTENT, n.dataset.contentSrc); if (v) n.src = v; });
    $$('[data-content-alt]').forEach((n) => { const v = get(CONTENT, n.dataset.contentAlt); if (v) n.alt = v; });
    // meta description
    const meta = $('meta[name="description"]');
    if (meta) meta.content = biz.tagline || '';
  }

  /* ---------- CTA buttons via [data-cta="path"] ---------- */
  function bindCtas() {
    $$('[data-cta]').forEach((node) => applyCta(node, get(CONTENT, node.dataset.cta)));
  }

  /* ---------- optional brand logo image ---------- */
  // if business.logo is set, swap the text/mark brand for the logo image
  function buildLogo() {
    const logo = get(CONTENT, 'business.logo');
    if (!logo) return;
    const alt = [get(CONTENT, 'business.name'), get(CONTENT, 'business.nameSuffix')].filter(Boolean).join(' ');
    $$('[data-brand-logo]').forEach((img) => {
      img.src = logo;
      img.alt = alt;
      img.hidden = false;
      const brand = img.closest('.brand');
      if (brand) {
        brand.classList.add('brand--logo');
        // hide the fallback text mark once the logo is in place
        brand.querySelector('.brand__mark')?.setAttribute('hidden', '');
        brand.querySelector('.brand__name')?.setAttribute('hidden', '');
      }
    });
  }

  /* ---------- 3. NAV ---------- */
  function buildNav() {
    const list = $('[data-nav-links]');
    (get(CONTENT, 'nav.links') || []).forEach((link) => {
      const li = el('li');
      li.appendChild(el('a', 'nav__link', esc(link.label))).setAttribute('href', link.href);
      list.appendChild(li);
    });
    applyCta($('[data-nav-cta]'), get(CONTENT, 'nav.cta'));

    // mobile toggle
    const toggle = $('[data-nav-toggle]');
    const nav = $('[data-nav]');
    toggle?.addEventListener('click', () => {
      const open = nav.dataset.open === 'true';
      nav.dataset.open = String(!open);
      toggle.setAttribute('aria-expanded', String(!open));
    });
    nav?.addEventListener('click', (e) => { if (e.target.matches('.nav__link')) { nav.dataset.open = 'false'; toggle.setAttribute('aria-expanded', 'false'); } });
  }

  /* ---------- HERO stats + marquee ---------- */
  function buildHero() {
    // shop name in the hero kicker (name + suffix)
    const biz = get(CONTENT, 'business') || {};
    const brand = $('[data-hero-brand]');
    if (brand) brand.textContent = [biz.name, biz.nameSuffix].filter(Boolean).join(' ');

    // if the hero photo is missing/broken, hide it so the dark gradient shows cleanly
    const bgImg = $('[data-hero-bg] img');
    if (bgImg) bgImg.addEventListener('error', () => { bgImg.style.display = 'none'; });

    const statsWrap = $('[data-hero-stats]');
    (get(CONTENT, 'hero.stats') || []).forEach((s) => {
      const li = el('li', 'hero__stat',
        `<span class="hero__stat-value">${esc(s.value)}</span><span class="hero__stat-label">${esc(s.label)}</span>`);
      statsWrap.appendChild(li);
    });

    const m = get(CONTENT, 'marquee');
    if (m?.enabled && m.items?.length) {
      const wrap = $('[data-marquee]');
      wrap.hidden = false;
      const track = $('[data-marquee-track]');
      m.items.forEach((it) => track.appendChild(el('li', 'trust__item', esc(it))));
    }
  }

  /* ---------- SERVICES ---------- */
  function buildServices() {
    const wrap = $('[data-services]');
    (get(CONTENT, 'services.items') || []).forEach((s) => {
      const features = (s.features || [])
        .map((f) => `<span class="service-card__feature">${esc(f)}</span>`).join('');
      const card = el('article', 'service-card', `
        <div class="service-card__icon">${icon(s.icon)}</div>
        <h3 class="service-card__title">${esc(s.title)}</h3>
        <p class="service-card__desc">${esc(s.description)}</p>
        <div class="service-card__features">${features}</div>
        ${s.price ? `<div class="service-card__price">${esc(s.price)}</div>` : ''}
      `);
      wrap.appendChild(card);
    });
  }

  /* ---------- BEFORE / AFTER (draggable slider) ---------- */
  function buildBeforeAfter() {
    const wrap = $('[data-before-after]');
    (get(CONTENT, 'beforeAfter.items') || []).forEach((item) => {
      const card = el('article', 'ba');
      card.innerHTML = `
        <div class="ba__frame" style="--ba-pos:50%">
          <img class="ba__img ba__img--before" src="${esc(item.before)}" alt="Înainte — ${esc(item.label)}" loading="lazy" />
          <img class="ba__img ba__img--after" src="${esc(item.after)}" alt="După — ${esc(item.label)}" loading="lazy" />
          <span class="ba__tag ba__tag--before">Înainte</span>
          <span class="ba__tag ba__tag--after">După</span>
          <span class="ba__divider"></span>
          <span class="ba__handle" aria-hidden="true">⟺</span>
        </div>
        <div class="ba__label">${esc(item.label)}</div>`;
      wrap.appendChild(card);
      initBaDrag($('.ba__frame', card));
    });
  }
  function initBaDrag(frame) {
    let dragging = false;
    const setPos = (clientX) => {
      const r = frame.getBoundingClientRect();
      let pct = ((clientX - r.left) / r.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      frame.style.setProperty('--ba-pos', pct + '%');
    };
    const start = (e) => { dragging = true; setPos((e.touches ? e.touches[0] : e).clientX); };
    const move  = (e) => { if (dragging) setPos((e.touches ? e.touches[0] : e).clientX); };
    const end   = () => { dragging = false; };
    frame.addEventListener('mousedown', start);
    frame.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
    // hover-to-scrub on desktop for delight
    frame.addEventListener('mousemove', (e) => { if (!dragging) setPos(e.clientX); });
  }

  /* ---------- PROCESS ---------- */
  function buildProcess() {
    const wrap = $('[data-process]');
    (get(CONTENT, 'process.steps') || []).forEach((step) => {
      const li = el('li', 'process__step', `
        <div class="process__step-num">${esc(step.number)}<sup>●</sup></div>
        <h3 class="process__step-title">${esc(step.title)}</h3>
        <p class="process__step-desc">${esc(step.description)}</p>`);
      wrap.appendChild(li);
    });
  }

  /* ---------- BENEFITS ---------- */
  function buildBenefits() {
    const wrap = $('[data-benefits]');
    (get(CONTENT, 'benefits.items') || []).forEach((b) => {
      const card = el('article', 'benefit', `
        <div class="benefit__icon">${icon(b.icon)}</div>
        <h3 class="benefit__title">${esc(b.title)}</h3>
        <p class="benefit__desc">${esc(b.description)}</p>`);
      wrap.appendChild(card);
    });
  }

  /* ---------- GALLERY + lightbox ---------- */
  function buildGallery() {
    const wrap = $('[data-gallery]');
    (get(CONTENT, 'gallery.items') || []).forEach((g) => {
      const fig = el('figure', 'gallery__item', `
        <img src="${esc(g.image)}" alt="${esc(g.caption || '')}" loading="lazy" />
        ${g.caption ? `<figcaption class="gallery__caption">${esc(g.caption)}</figcaption>` : ''}`);
      fig.addEventListener('click', () => openLightbox(g.image, g.caption));
      wrap.appendChild(fig);
    });
  }
  function openLightbox(src, caption) {
    const box = $('[data-lightbox]');
    $('[data-lightbox-img]').src = src;
    $('[data-lightbox-img]').alt = caption || '';
    $('[data-lightbox-caption]').textContent = caption || '';
    box.hidden = false; box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    const box = $('[data-lightbox]');
    box.hidden = true; box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ---------- REVIEWS ---------- */
  function buildReviews() {
    const wrap = $('[data-reviews]');
    (get(CONTENT, 'reviews.items') || []).forEach((r) => {
      const card = el('article', 'review', `
        <div class="review__stars" aria-label="${r.rating} din 5">${stars(r.rating)}</div>
        <p class="review__text">${esc(r.text)}</p>
        <div class="review__author">
          <img class="review__avatar" src="${esc(r.avatar || '')}" alt="${esc(r.name)}" loading="lazy" />
          <div>
            <div class="review__name">${esc(r.name)}</div>
            <div class="review__role">${esc(r.role || '')}</div>
          </div>
        </div>`);
      wrap.appendChild(card);
    });
  }

  /* ---------- FAQ accordion ---------- */
  function buildFaq() {
    const wrap = $('[data-faq]');
    (get(CONTENT, 'faq.items') || []).forEach((f) => {
      const item = el('div', 'faq__item');
      item.dataset.open = 'false';
      item.innerHTML = `
        <button class="faq__question" aria-expanded="false">
          <span>${esc(f.question)}</span>
          <span class="faq__icon" aria-hidden="true"></span>
        </button>
        <div class="faq__answer"><div class="faq__answer-inner">${esc(f.answer)}</div></div>`;
      const btn = $('.faq__question', item);
      const ans = $('.faq__answer', item);
      btn.addEventListener('click', () => {
        const open = item.dataset.open === 'true';
        // close siblings for a clean single-open accordion
        $$('.faq__item', wrap).forEach((sib) => {
          if (sib !== item) { sib.dataset.open = 'false'; $('.faq__answer', sib).style.height = '0px'; $('.faq__question', sib).setAttribute('aria-expanded', 'false'); }
        });
        item.dataset.open = String(!open);
        btn.setAttribute('aria-expanded', String(!open));
        ans.style.height = open ? '0px' : ans.scrollHeight + 'px';
      });
      wrap.appendChild(item);
    });
  }

  /* ---------- CONTACT ---------- */
  function buildContact() {
    const biz = get(CONTENT, 'business') || {};
    const details = $('[data-contact-details]');
    const rows = [
      biz.phone   && { icon: 'phone', text: biz.phone, href: telLink() },
      biz.email   && { icon: 'mail',  text: biz.email, href: `mailto:${biz.email}` },
      biz.address && { icon: 'pin',   text: biz.address, href: biz.mapsUrl },
      biz.hours   && { icon: 'clock', text: biz.hours }
    ].filter(Boolean);
    rows.forEach((r) => {
      const inner = r.href ? `<a href="${esc(r.href)}">${esc(r.text)}</a>` : `<span>${esc(r.text)}</span>`;
      details.appendChild(el('li', 'contact__detail', `<span class="contact__detail-icon">${icon(r.icon)}</span>${inner}`));
    });

    // whatsapp button
    const waBtn = $('[data-contact-whatsapp]');
    if (waBtn) { waBtn.textContent = 'Scrie-ne pe WhatsApp'; waBtn.href = waLink(get(CONTENT, 'contact.whatsappMessage')); waBtn.target = '_blank'; waBtn.rel = 'noopener'; }

    // social
    const social = $('[data-contact-social]');
    (biz.social || []).forEach((s) => {
      const a = el('a', null, esc(s.label)); a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
      social.appendChild(a);
    });
    const map = $('[data-contact-map]');
    if (map && biz.mapsUrl) map.href = biz.mapsUrl;
  }

  /* ---------- FOOTER ---------- */
  function buildFooter() {
    const cols = $('[data-footer-cols]');
    (get(CONTENT, 'footer.columns') || []).forEach((col) => {
      const c = el('div', 'footer__col', `<h4 class="footer__col-title">${esc(col.title)}</h4>`);
      (col.links || []).forEach((l) => {
        const a = el('a', null, esc(l.label)); a.href = l.href; c.appendChild(a);
      });
      cols.appendChild(c);
    });
  }

  /* ---------- floating WhatsApp FAB ---------- */
  function buildFab() {
    const fab = $('[data-whatsapp-fab]');
    if (fab) { fab.href = waLink(get(CONTENT, 'whatsappDefaultMessage')); fab.target = '_blank'; fab.rel = 'noopener'; }
  }

  /* ---------- interactions: reveal, header, lightbox ---------- */
  function initInteractions() {
    // scroll reveal
    const reveals = $$('[data-reveal]');
    reveals.forEach((n) => { if (n.dataset.revealDelay) n.style.setProperty('--reveal-delay', n.dataset.revealDelay); });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach((n) => io.observe(n));
    } else {
      reveals.forEach((n) => n.classList.add('is-visible'));
    }

    // header scrolled state
    const header = $('[data-header]');
    const onScroll = () => header?.setAttribute('data-scrolled', String(window.scrollY > 8));
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    // lightbox close
    $('[data-lightbox-close]')?.addEventListener('click', closeLightbox);
    $('[data-lightbox]')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeLightbox(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
  }

  // auto-reveal any section head / grid child that wasn't tagged in HTML,
  // so dynamically injected cards also animate in nicely.
  function tagDynamicReveals() {
    const groups = ['[data-services]', '[data-benefits]', '[data-reviews]', '[data-before-after]', '[data-process]', '[data-gallery]'];
    groups.forEach((sel) => {
      const wrap = $(sel); if (!wrap) return;
      [...wrap.children].forEach((child, i) => {
        child.setAttribute('data-reveal', '');
        child.setAttribute('data-reveal-delay', String(Math.min(i, 4)));
      });
    });
  }

  /* ---------- boot ---------- */
  async function boot() {
    try {
      const [tokens, content] = await Promise.all([
        fetch('tokens.json').then((r) => r.json()),
        fetch('content.json').then((r) => r.json())
      ]);
      CONTENT = content;
      applyTokens(tokens);

      bindStatic();
      bindCtas();
      buildLogo();
      buildNav();
      buildHero();
      buildServices();
      buildBeforeAfter();
      buildProcess();
      buildBenefits();
      buildGallery();
      buildReviews();
      buildFaq();
      buildContact();
      buildFooter();
      buildFab();

      tagDynamicReveals();
      initInteractions();
    } catch (err) {
      console.error('[LimeSpark] Nu am putut încărca datele:', err);
      document.body.insertAdjacentHTML('afterbegin',
        '<p style="padding:1rem;background:#fee;color:#900;font-family:sans-serif">Eroare la încărcarea content.json / tokens.json. Rulează site-ul printr-un server local (vezi README).</p>');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
