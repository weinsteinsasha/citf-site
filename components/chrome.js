/* CITF shared chrome — loads the EXACT Tilda header + footer
 * (extracted verbatim from the homepage) onto any page.
 *
 * Usage on any page:
 *   <div id="citf-header-mount"></div>
 *     ... page content ...
 *   <div id="citf-footer-mount"></div>
 *   <script src="/components/chrome.js" defer></script>
 *
 * The script:
 *   1. Injects the Tilda CSS bundles the chrome depends on (idempotent).
 *   2. Loads the Tilda JS bundles in dependency order (jquery -> scripts ->
 *      page-blocks -> animation/popup/forms/etc).
 *   3. Fetches /components/header.html and /components/footer.html
 *      (verbatim copies from the homepage Tilda export) and inserts
 *      them at the mount points.
 *   4. Re-executes the inline <script> tags inside the fetched chrome
 *      so Tilda's t396_init / t1003_init / t1093__init callbacks fire.
 *
 * To update the chrome site-wide: re-export header/footer from the
 * homepage and overwrite components/header.html / components/footer.html.
 */
(function () {
  'use strict';

  var TILDA_CSS = [
    '/css/tilda-grid-3.0.min.css',
    '/css/tilda-blocks-page121413356.min.css?t=1776697778',
    '/css/tilda-animation-2.0.min.css',
    '/css/tilda-popup-1.1.min.css',
    '/css/tilda-forms-1.0.min.css',
    '/css/custom.css?t=1776697778'
  ];

  var TILDA_JS = [
    'https://neo.tildacdn.com/js/tilda-fallback-1.0.min.js',
    '/js/tilda-polyfill-1.0.min.js',
    '/js/jquery-1.10.2.min.js',
    '/js/tilda-scripts-3.0.min.js',
    '/js/tilda-blocks-page121413356.min.js?t=1776697778',
    '/js/lazyload-1.3.min.export.js',
    '/js/tilda-animation-2.0.min.js',
    '/js/tilda-zero-1.1.min.js',
    '/js/tilda-popup-1.0.min.js',
    '/js/tilda-forms-1.0.min.js',
    '/js/tilda-zero-forms-1.0.min.js',
    '/js/tilda-animation-ext-1.0.min.js',
    '/js/tilda-animation-sbs-1.0.min.js',
    '/js/tilda-zero-scale-1.0.min.js',
    '/js/tilda-zero-video-1.0.min.js',
    '/js/tilda-events-1.0.min.js'
  ];

  function injectCSS(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.type = 'text/css';
    l.media = 'all';
    document.head.appendChild(l);
  }

  function injectScript(src) {
    return new Promise(function (resolve, reject) {
      // skip if already on page
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = false;          // keep load order
      s.onload = resolve;
      s.onerror = function () { console.warn('[citf chrome] failed to load', src); resolve(); };
      document.head.appendChild(s);
    });
  }

  function injectAllCSS() {
    TILDA_CSS.forEach(injectCSS);
    injectInlineCSS();
  }

  // i18n CSS + visible lang-toggle pill styles. Injected synchronously so the
  // page never flashes all three language versions at once.
  function injectInlineCSS() {
    if (document.getElementById('citf-i18n-css')) return;
    var s = document.createElement('style');
    s.id = 'citf-i18n-css';
    s.textContent = "" +
      /* hide inactive language nodes */
      "html[data-lang=en] [data-ru],html[data-lang=en] [data-gr]," +
      "html[data-lang=ru] [data-en],html[data-lang=ru] [data-gr]," +
      "html[data-lang=gr] [data-en],html[data-lang=gr] [data-ru]{display:none !important}" +

      /* lang pill mounted INSIDE the Tilda nav, just before the social icons */
      ".citf-navlangs{display:inline-flex;align-items:center;gap:0;font-family:'Syne',Arial,sans-serif;background:#0e0e0e;border:1px solid #333;border-radius:999px;padding:3px 4px;margin-right:8px;vertical-align:middle}" +
      ".citf-navlangs button{font-family:inherit;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:5px 9px;color:#888;font-weight:700;background:none;border:0;cursor:pointer;border-radius:999px;transition:color 0.15s,background 0.15s}" +
      ".citf-navlangs button:hover{color:#fff}" +
      ".citf-navlangs button.active{background:#FFA806;color:#000}" +
      ".citf-navlangs.floating{position:fixed;top:40px;right:14px;z-index:9999;background:rgba(17,17,17,0.94);box-shadow:0 4px 16px rgba(0,0,0,0.4);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}" +

      /* Lang pill — absolutely positioned inside Tilda's header artboard.
         Final top/left coords are set in JS to match the social-icons row exactly,
         and recomputed on resize. */
      ".citf-navlangs.in-nav{position:absolute;z-index:120;background:rgba(14,14,14,0.85);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}" +
      /* On mobile (≤640), DON'T trust JS positioning — Tilda's artboard
         coordinate system is unreliable on iOS Safari. Pin the pill to the
         viewport at the top-right, just left of the MENU button. */
      "@media(max-width:640px){" +
        ".citf-navlangs.in-nav{position:fixed !important;top:18px !important;right:108px !important;left:auto !important;padding:2px 3px;z-index:200}" +
        ".citf-navlangs.in-nav button{font-size:10px;padding:5px 8px;letter-spacing:0.14em}" +
      "}" +

      /* floating Buy Ticket button — bottom-right, configurable per page via window.CITF_BUY */
      ".citf-buyfab{position:fixed;bottom:22px;right:22px;z-index:9998;display:inline-flex;align-items:center;gap:8px;background:#FFA806;color:#000 !important;font-family:'Syne',Arial,sans-serif;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;font-weight:800;padding:14px 22px;border-radius:999px;text-decoration:none !important;box-shadow:0 8px 28px rgba(255,168,6,0.35),0 4px 12px rgba(0,0,0,0.4);transition:transform 0.15s ease,background 0.15s ease}" +
      ".citf-buyfab:hover{background:#ffbd38;transform:translateY(-2px)}" +
      ".citf-buyfab svg{width:14px;height:14px;fill:currentColor}" +
      ".citf-buyfab small{display:block;font-size:9px;letter-spacing:0.14em;color:rgba(0,0,0,0.6);font-weight:600;margin-top:2px;text-transform:none}" +
      ".citf-buyfab-inner{display:flex;flex-direction:column;align-items:flex-start}" +
      "@media(max-width:520px){.citf-buyfab{bottom:14px;right:14px;padding:12px 16px;font-size:11px;letter-spacing:0.12em}}" +

      /* Hide the desktop menu links + decorative elements at viewports
         <1200px. Tilda's design keeps SHOWS & EVENT / ABOUT / THE FESTIVAL
         PASS visible at the tablet breakpoint, but they overlap the MENU
         button + lang pill — and once the MENU popup carries the same
         items, showing them inline is redundant. Whitelist: logo (image),
         MENU button (rec853550221 elem-id 1730997530909), our lang pill. */
      "@media(max-width:1199px){" +
        "#rec853550221 .tn-elem{display:none !important}" +
        "#rec853550221 [data-elem-id=\"1730978182370\"]," +     /* CITF logo image */
        "#rec853550221 [data-elem-id=\"1730997530909\"]," +     /* MENU button */
        "#rec853550221 [data-elem-id=\"1731422568840\"]," +     /* logo+text wrapper button */
        "#rec853550221 .citf-navlangs.in-nav" +                  /* our lang pill */
        "{display:block !important}" +
      "}" +

      /* Partner bitmap responsive override — Tilda hard-codes the artboard
         height (489px desktop / 242px tablet / 110px mobile) which clips the
         image when viewport width changes. Force the artboard to auto-size
         and the image to keep its natural aspect ratio at any width. */
      "#rec890778214 .t396__artboard,#rec890778214 .t396__filter,#rec890778214 .t396__carrier{height:auto !important;min-height:0 !important}" +
      "#rec890781301 .t396__artboard,#rec890781301 .t396__filter,#rec890781301 .t396__carrier{height:auto !important;min-height:0 !important}" +
      "#rec890778214 .t396__elem[data-elem-type='image'],#rec890781301 .t396__elem[data-elem-type='image']{position:relative !important;top:auto !important;left:auto !important;width:100% !important;height:auto !important;display:block !important}" +
      "#rec890778214 .t396__elem[data-elem-type='image'] .tn-atom,#rec890781301 .t396__elem[data-elem-type='image'] .tn-atom{display:block !important;width:100% !important;height:auto !important}" +
      "img[imgfield='tn_img_1741704123132']{width:100% !important;height:auto !important;max-width:100% !important;display:block !important;object-fit:contain !important}" +
      /* Hide stray Tilda placeholder text labels that bled through after we
         flipped artboard children to position:relative (image-only). */
      "#rec890778214 .t396__elem[data-elem-type='text'],#rec890781301 .t396__elem[data-elem-type='text']{display:none !important}" +
      "#rec890778214 [data-elem-id='1741704284989'],#rec890781301 [data-elem-id='1741704284989']{display:none !important}" +

      /* MOBILE HEADER POLISH (≤640px):
         The default Tilda logo is a horizontal lockup (243×78) — monogram on
         the left + "CYPRUS INTERNATIONAL THEATRE FESTIVAL" wordmark on the
         right. On mobile we swap the src to the standalone monogram SVG
         (see swapMobileLogo()), and shrink the slot so the layout reflows. */
      "@media(max-width:640px){" +
        /* Logo: pin to top-left, fixed in viewport so it doesn't scroll out */
        "#rec853550221 .tn-elem[data-elem-id='1730978182370']{" +
          "position:fixed !important;width:50px !important;max-width:50px !important;height:50px !important;left:14px !important;top:14px !important;z-index:121 !important" +
        "}" +
        "#rec853550221 .tn-elem[data-elem-id='1730978182370'] .tn-atom{" +
          "width:50px !important;max-width:50px !important;height:50px !important;display:block !important" +
        "}" +
        "#rec853550221 .tn-elem[data-elem-id='1730978182370'] .tn-atom__img{" +
          "width:50px !important;max-width:50px !important;height:50px !important;display:block !important" +
        "}" +
        /* MENU button: pin to top-right, fixed in viewport always */
        "#rec853550221 .tn-elem[data-elem-id='1730997530909']{" +
          "position:fixed !important;top:18px !important;right:14px !important;left:auto !important;width:auto !important;z-index:121 !important" +
        "}" +
        /* Reserve a fixed-height "header zone" at the top of the page so the
           hero content doesn't disappear under the floating logo + MENU. */
        "#rec853550221{position:relative;height:78px}" +
        "#rec853550221 .t396__artboard,#rec853550221 .t396__filter,#rec853550221 .t396__carrier{height:78px !important;min-height:78px !important;background:transparent !important}" +
        /* Solid bar behind the floating header so content doesn't bleed through */
        "body::before{content:'';position:fixed;top:0;left:0;right:0;height:78px;background:rgba(24,24,24,0.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:119;pointer-events:none}" +
      "}" +

      /* Make sure rec824824359 (bottom-row footer with socials, legal,
         "Become our partner", copyright) stays clickable. Tilda's t396 wraps
         each button text in <a class='tn-atom'> + <span class='tn-atom__button-border'></span>;
         the border span sometimes overlays the link and intercepts taps on
         iOS. Force the link to occupy the full element area and the border
         to be non-interactive. Min-height 44px = Apple HIG touch target. */
      "#rec824824359 a.tn-atom{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:44px !important;pointer-events:auto !important;z-index:2;padding:8px 4px}" +
      "#rec824824359 .tn-atom__button-border{pointer-events:none !important;z-index:1}" +
      "#rec824824359 .t396__elem[data-elem-type='button']{min-height:44px !important}" +

      /* Hide the running marquee ticker on narrow phones — it competes with
         the lang pill + MENU button for height in the first 60px and looks
         cluttered. Keep it on tablet+ where there's more room. */
      "@media(max-width:520px){#rec1157755106{display:none !important}}" +

      /* Custom CITF mobile menu — overrides Tilda's broken t1093 popup. */
      ".citf-menu{position:fixed;inset:0;z-index:10000;background:rgba(10,10,10,0.97);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:none;flex-direction:column;padding:64px 28px 40px;font-family:'Syne',Arial,sans-serif}" +
      "html[data-lang=ru] .citf-menu{font-family:'Unbounded','Syne',Arial,sans-serif}" +
      ".citf-menu.open{display:flex}" +
      ".citf-menu__close{position:absolute;top:18px;right:18px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,0.25);background:transparent;color:#fff;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}" +
      ".citf-menu__close:hover{border-color:#FFA806;color:#FFA806}" +
      ".citf-menu nav{margin-top:12px;display:flex;flex-direction:column;gap:6px}" +
      ".citf-menu nav a{display:block;padding:14px 4px;color:#eee;font-size:18px;font-weight:700;letter-spacing:0.04em;text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.08)}" +
      ".citf-menu nav a:hover,.citf-menu nav a:active{color:#FFA806}" +
      ".citf-menu__cta{display:inline-flex;align-items:center;justify-content:center;gap:10px;margin-top:24px;padding:18px 26px;border-radius:999px;background:#FFA806;color:#000;font-size:13px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none}" +
      ".citf-menu__socials{margin-top:auto;padding-top:24px;display:flex;gap:18px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#888}" +
      ".citf-menu__socials a{color:#888;text-decoration:none}" +
      ".citf-menu__socials a:hover{color:#FFA806}" +
      "";
    document.head.appendChild(s);
  }

  // Build the EN | RU | EL pill markup (used both as floating fallback and inside nav)
  function makeLangPillElement(extraClass) {
    var pill = document.createElement('div');
    pill.className = 'citf-navlangs' + (extraClass ? ' ' + extraClass : '');
    pill.setAttribute('role', 'tablist');
    pill.innerHTML =
      '<button data-citf-setlang="en">EN</button>' +
      '<button data-citf-setlang="ru">RU</button>' +
      '<button data-citf-setlang="gr">EL</button>';
    pill.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        setLang(b.getAttribute('data-citf-setlang'));
      });
    });
    return pill;
  }

  // Floating fallback pill — visible only until the chrome arrives and we move it into the nav.
  function injectFallbackLangPill() {
    if (document.querySelector('.citf-navlangs.floating')) return;
    document.body.appendChild(makeLangPillElement('floating'));
  }

  // After chrome mounts, drop the lang pill INSIDE the Tilda header and pin it
  // to the same row as the social icons — by reading the live position of the
  // Facebook anchor (which Tilda re-computes on every resize). The pill becomes
  // a sibling of the social icons inside the same .t396__artboard so it shares
  // the same coordinate system.
  // Find the VISIBLE anchor inside the Tilda header to align the lang pill to.
  // Strategy: prefer the social-icons row if it's actually painted on screen
  // (desktop layout), otherwise fall back to the MENU button — which is always
  // visible across all breakpoints. Returns the .tn-elem wrapper.
  function isElemVisible(el) {
    if (!el) return false;
    var rect = el.getBoundingClientRect();
    if (rect.height <= 0 || rect.width <= 0) return false;
    if (rect.top < 0 || rect.top > window.innerHeight) return false;
    var p = el;
    while (p && p !== document.body) {
      var cs = window.getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      p = p.parentElement;
    }
    return true;
  }

  function findHeaderAnchorElem() {
    var i, a, elem;
    // 1) Prefer social icons if visible (desktop layout)
    var socials = document.querySelectorAll('#t-header a[href*="facebook.com"], #t-header a[href*="instagram.com"]');
    for (i = 0; i < socials.length; i++) {
      elem = socials[i].closest('.tn-elem') || socials[i].parentElement;
      if (isElemVisible(elem)) return elem;
    }
    // 2) Fallback: the MENU button — it's the burger/menu trigger and is shown on every breakpoint
    var allElems = document.querySelectorAll('#t-header .tn-elem');
    for (i = 0; i < allElems.length; i++) {
      var t = (allElems[i].textContent || '').trim().toUpperCase();
      if ((t === 'MENU' || t === 'МЕНЮ' || t === 'ΜΕΝΟΥ') && isElemVisible(allElems[i])) {
        return allElems[i];
      }
    }
    return null;
  }

  function positionLangPill(pill) {
    // On mobile, CSS handles the positioning — keep the pill in body and
    // clear any JS-computed inline styles so the !important rules win.
    if (window.innerWidth <= 640) {
      if (pill.parentElement !== document.body) document.body.appendChild(pill);
      pill.style.position = '';
      pill.style.top = '';
      pill.style.right = '';
      pill.style.left = '';
      return true;
    }
    var anchor = findHeaderAnchorElem();
    if (!anchor || !anchor.parentElement) return false;
    var anchorPos = window.getComputedStyle(anchor).position;
    var aRect = anchor.getBoundingClientRect();
    var pillH = pill.offsetHeight || 28;
    if (anchorPos === 'fixed') {
      if (pill.parentElement !== document.body) document.body.appendChild(pill);
      pill.style.position = 'fixed';
      pill.style.top   = Math.max(0, Math.round(aRect.top + (aRect.height - pillH) / 2)) + 'px';
      pill.style.right = Math.max(0, Math.round(window.innerWidth - aRect.left + 12)) + 'px';
      pill.style.left  = 'auto';
      return true;
    }
    // Default: position inside the same artboard as the anchor (desktop)
    var artboard = anchor.parentElement;
    if (artboard !== pill.parentElement) artboard.appendChild(pill);
    pill.style.position = 'absolute';
    var abRect = artboard.getBoundingClientRect();
    var topPx   = aRect.top  - abRect.top + (aRect.height - pillH) / 2;
    var rightPx = abRect.right - aRect.left + 16; // 16-px gap to anchor's left edge
    pill.style.top   = Math.max(0, Math.round(topPx))   + 'px';
    pill.style.right = Math.max(0, Math.round(rightPx)) + 'px';
    pill.style.left  = 'auto';
    return true;
  }

  function attachLangSwitcherToNav() {
    var header = document.getElementById('t-header');
    if (!header) return;
    var pill = document.querySelector('.citf-navlangs.in-nav');
    if (!pill) {
      pill = makeLangPillElement('in-nav');
      header.appendChild(pill);                // temp — positionLangPill moves it into the artboard
    }
    var floating = document.querySelector('.citf-navlangs.floating');
    if (floating) floating.remove();
    // Tilda's t396_init applies the right breakpoint position to MENU/FB
    // some time after our boot — keep trying until the anchor becomes
    // visible (up to ~12s, then fall back to a slow retry).
    var attempts = 0, iv = setInterval(function () {
      if (positionLangPill(pill) || ++attempts > 60) clearInterval(iv);
    }, 200);
    setLang(initialLang());
  }

  function repinLangPill() {
    var pill = document.querySelector('.citf-navlangs.in-nav');
    if (pill) positionLangPill(pill);
  }

  // Floating "Buy Ticket" FAB. Page configures via window.CITF_BUY before chrome.js loads:
  //   window.CITF_BUY = { url: '...', en: 'Buy ticket', ru: 'Купить билет', gr: 'Αγοράστε', sub_en: 'from €30', ... }
  function injectBuyFab() {
    if (document.querySelector('.citf-buyfab')) return;
    var cfg = (window.CITF_BUY && typeof window.CITF_BUY === 'object') ? window.CITF_BUY : null;
    if (!cfg || !cfg.url) return;
    var a = document.createElement('a');
    a.className = 'citf-buyfab';
    a.href = cfg.url;
    a.target = '_blank';
    a.rel = 'noopener';
    var inner =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 7H3a1 1 0 0 0-1 1v3a2 2 0 0 1 0 4v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-4V8a1 1 0 0 0-1-1Zm-7 8h-2v-2h2v2Zm0-4h-2V9h2v2Z"/></svg>' +
      '<span class="citf-buyfab-inner">' +
        '<span data-en>'+ (cfg.en || 'Buy ticket') +'</span>' +
        '<span data-ru>'+ (cfg.ru || 'Купить билет') +'</span>' +
        '<span data-gr>'+ (cfg.gr || 'Εισιτήριο') +'</span>' +
        (cfg.sub_en || cfg.sub_ru || cfg.sub_gr ?
          '<small data-en>'+ (cfg.sub_en || '') +'</small>' +
          '<small data-ru>'+ (cfg.sub_ru || '') +'</small>' +
          '<small data-gr>'+ (cfg.sub_gr || '') +'</small>'
        : '') +
      '</span>';
    a.innerHTML = inner;
    document.body.appendChild(a);
    // Hide the FAB whenever an inline primary CTA is in the viewport — no
    // point in duplicating the same call-to-action twice on screen.
    var inlineCtas = document.querySelectorAll('.btn-primary, .hero-ctas .btn-primary, a[href*="soldoutticketbox"], a[href*="partnership.citf.cy/quiz"]');
    if (inlineCtas.length && 'IntersectionObserver' in window) {
      var visibleCount = 0;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) visibleCount++; else visibleCount = Math.max(0, visibleCount - 1);
        });
        if (visibleCount > 0) {
          a.style.opacity = '0';
          a.style.pointerEvents = 'none';
          a.style.transform = 'translateY(20px)';
        } else {
          a.style.opacity = '';
          a.style.pointerEvents = '';
          a.style.transform = '';
        }
      }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
      inlineCtas.forEach(function (el) { io.observe(el); });
      a.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    }
  }

  // Partners are rendered by Tilda's footer bitmap (the shared Tilda chrome).
  // Files /images/partners/<name>.png are extracted individual logos kept
  // for future use; they are not currently rendered.
  function injectPartnersBlock() { /* no-op — Tilda bitmap is the source of truth */ }

  // Swap the wide CITF logo for the monogram-only SVG on mobile (≤640px).
  // The wide logo is a horizontal lockup with the wordmark on the right;
  // it doesn't fit alongside the MENU button + lang pill on small phones.
  function swapMobileLogo() {
    var FULL = '/images/tild3738-6662-4535-a334-316536636261__svg_1730978181783.svg';
    var MONO = '/images/citf-monogram.svg';
    function apply() {
      var imgs = document.querySelectorAll(
        "img[imgfield='tn_img_1730978182370'], #rec853550221 [data-elem-id='1730978182370'] img"
      );
      var isMobile = window.innerWidth <= 640;
      var target = isMobile ? MONO : FULL;
      imgs.forEach(function (img) {
        if (img.getAttribute('src') !== target) img.setAttribute('src', target);
        if (img.getAttribute('data-original') !== target) img.setAttribute('data-original', target);
      });
    }
    apply();
    window.addEventListener('resize', apply);
    // Re-apply after Tilda bundles run (they may overwrite src from data-original)
    setTimeout(apply, 600);
    setTimeout(apply, 1500);
  }

  // Build a clean custom mobile menu and override Tilda's broken t1093 popup.
  // Tilda's popup-1.0.min.js sometimes shows an empty modal on our exported
  // pages because the popup-rec-id source content isn't being cloned. We
  // intercept the MENU click and show our own modal with the same links.
  var CITF_NAV = [
    { href: '/',                        en: 'Home',          ru: 'Главная',          gr: 'Αρχική' },
    { href: '/2026/cassandre',          en: 'Cassandre',     ru: 'Кассандра',        gr: 'Κασσάνδρα' },
    { href: '/2026/cocktail-with-fanny-ardant', en: 'Cocktail with Fanny Ardant', ru: 'Коктейль с Фанни Ардан', gr: 'Κοκτέιλ με Φανί Αρντάν' },
    { href: '/the-festival-pass',       en: 'The Festival Pass', ru: 'Festival Pass', gr: 'Festival Pass' },
    { href: '/about',                   en: 'About',         ru: 'О фестивале',      gr: 'Σχετικά' },
    { href: 'https://partnership.citf.cy', en: 'Become a partner', ru: 'Стать партнёром', gr: 'Γίνετε συνεργάτης' }
  ];
  function buildCitfMenu() {
    if (document.getElementById('citf-mobile-menu')) return;
    var modal = document.createElement('div');
    modal.id = 'citf-mobile-menu';
    modal.className = 'citf-menu';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    var navHtml = CITF_NAV.map(function (item) {
      return '<a href="' + item.href + '">' +
        '<span data-en>' + item.en + '</span>' +
        '<span data-ru>' + item.ru + '</span>' +
        '<span data-gr>' + item.gr + '</span>' +
        '</a>';
    }).join('');
    modal.innerHTML =
      '<button type="button" class="citf-menu__close" aria-label="Close">×</button>' +
      '<nav>' + navHtml + '</nav>' +
      '<div class="citf-menu__socials">' +
        '<a href="https://instagram.com/citf.cy" target="_blank" rel="noopener">Instagram</a>' +
        '<a href="https://facebook.com/citf.cy" target="_blank" rel="noopener">Facebook</a>' +
        '<a href="https://youtube.com/@citf.cy" target="_blank" rel="noopener">YouTube</a>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelector('.citf-menu__close').addEventListener('click', closeCitfMenu);
    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) closeCitfMenu();
    });
  }
  function openCitfMenu() {
    buildCitfMenu();
    var m = document.getElementById('citf-mobile-menu');
    if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
  }
  function closeCitfMenu() {
    var m = document.getElementById('citf-mobile-menu');
    if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
  }
  function bindMenuButton() {
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest('a[href="#mobilemenu"]');
      if (!a) return;
      ev.preventDefault();
      ev.stopPropagation();
      openCitfMenu();
    }, true);
    // ESC closes
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeCitfMenu();
    });
  }

  // Hard-bind the Tilda footer-row "Become our partner" link, which on iOS
  // sometimes loses its tap because Tilda's button-border overlay sits on top
  // of the <a>. We also handle the case where the rec's t396_doResize is
  // patched out (rec824824359 is in our skip-list to silence noise) — the
  // <a class='tn-atom'> inside still has the right href, so we just bind a
  // capture-phase click that follows it.
  function bindFooterButtons() {
    var rec = document.getElementById('rec824824359');
    if (!rec) return;
    if (rec.__citfBound) return;
    rec.__citfBound = true;
    rec.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.t396__elem[data-elem-type="button"]');
      if (!btn) return;
      var a = btn.querySelector('a.tn-atom[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.indexOf('#') === 0) return;
      // If the click already landed on the <a>, let the browser handle it.
      if (ev.target === a || a.contains(ev.target)) return;
      ev.preventDefault();
      window.open(href, a.getAttribute('target') || '_self');
    }, true);
  }

  // The bottom-footer rec (824824359) is missing some field data in our Tilda
  // export, so its t396_doResize crashes on every animation frame. Tilda
  // catches and console.errors each throw, flooding DevTools without affecting
  // what the user sees. We patch t396_doResize once it's available to skip
  // this specific rec — also belt-and-suspenders the console.error filter.
  function silenceKnownTildaNoise() {
    if (window.__citfNoiseSilenced) return;
    window.__citfNoiseSilenced = true;
    var BAD = '824824359';
    // 1) Wait for t396_doResize to be defined, then wrap it
    var iv = setInterval(function () {
      if (typeof window.t396_doResize === 'function' && !window.t396_doResize.__citfPatched) {
        var orig = window.t396_doResize;
        window.t396_doResize = function (t, force) {
          if (String(t) === BAD) return;
          return orig.apply(this, arguments);
        };
        window.t396_doResize.__citfPatched = true;
        clearInterval(iv);
      }
    }, 30);
    // Stop trying after 10s
    setTimeout(function () { clearInterval(iv); }, 10000);
    // 2) Also filter console.error in case the wrap is too late
    var origError = console.error;
    console.error = function () {
      var first = arguments.length ? arguments[0] : '';
      if (typeof first === 'string' && first.indexOf('Error trying to resize rec' + BAD) === 0) return;
      return origError.apply(console, arguments);
    };
  }

  // Pre-stub window.tn['ab<recid>'] for every artboard in DOM so Tilda's
  // tilda-zero resize observer never sees an undefined entry. Reads
  // data-artboard-screens (set by Tilda export) and parses it as numbers.
  function preStubArtboards() {
    if (!window.tn) window.tn = {};
    document.querySelectorAll('.t396__artboard[data-artboard-recid][data-artboard-screens]').forEach(function (ab) {
      var recid = ab.getAttribute('data-artboard-recid');
      var key = 'ab' + recid;
      if (window.tn[key] && window.tn[key].screens) return;
      var raw = ab.getAttribute('data-artboard-screens') || '';
      var screens = raw.split(',').map(function (s) { return parseInt(s, 10); }).filter(function (n) { return n > 0; });
      if (screens.length === 0) screens = [320, 640, 1200];
      window.tn[key] = window.tn[key] || {};
      window.tn[key].screens = screens;
    });
  }

  function loadTildaJS() {
    // Load sequentially so dependencies (jquery first) resolve in order
    return TILDA_JS.reduce(function (acc, src) {
      return acc.then(function () { return injectScript(src); });
    }, Promise.resolve());
  }

  // Tilda CSS keys on body.t-body and #allrecords ancestors. Set those up so
  // the chrome's fonts, sizes, and #allrecords-scoped selectors apply.
  function prepareBody() {
    document.body.classList.add('t-body');
    document.body.style.margin = '0';
  }

  // Wrap ALL existing body children in <div id="allrecords"> so Tilda's
  // '#allrecords .r', '#allrecords a' and similar selectors apply to the
  // chrome AND we keep the page's natural document order
  // (header-mount → page content → footer-mount).
  function ensureAllrecords() {
    var ar = document.getElementById('allrecords');
    if (ar) return ar;
    ar = document.createElement('div');
    ar.id = 'allrecords';
    ar.className = 't-records';
    ar.setAttribute('data-tilda-export', 'yes');
    ar.setAttribute('data-tilda-project-id', '8561442');
    ar.setAttribute('data-tilda-formskey', 'b4653a09f154d821fd96e21128561442');
    // Move every existing body child into ar (preserves order)
    while (document.body.firstChild) {
      ar.appendChild(document.body.firstChild);
    }
    document.body.appendChild(ar);
    return ar;
  }

  // Fetch chrome HTML and replace the slot in-place (the slot is already
  // inside #allrecords because we wrapped the whole body). Re-executes inline
  // scripts so Tilda's t396_init / t1003_init / t1093__init fire.
  function mountFragment(slotId, url) {
    var slot = document.getElementById(slotId);
    if (!slot) return Promise.resolve();
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error(slotId + ' ' + r.status)); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var node = doc.body.firstElementChild || doc.body.firstChild;
        if (!node) throw new Error('empty fragment ' + slotId);
        slot.parentNode.replaceChild(node, slot);

        // Tilda's lazyload swaps src<-data-original on scroll. On our pages
        // the lazy-load init isn't catching properly, so partner logos and
        // other images stay as 20px-wide placeholders. Force the swap now.
        node.querySelectorAll('img[data-original]').forEach(function (img) {
          var full = img.getAttribute('data-original');
          if (full) img.setAttribute('src', full);
        });

        // Re-execute inline scripts (DOMParser disables them) by cloning into live <script> nodes.
        var scripts = node.querySelectorAll('script');
        scripts.forEach(function (old) {
          var s = document.createElement('script');
          for (var i = 0; i < old.attributes.length; i++) {
            s.setAttribute(old.attributes[i].name, old.attributes[i].value);
          }
          s.text = old.textContent || '';
          old.parentNode.replaceChild(s, old);
        });
      })
      .catch(function (err) { console.warn('[citf chrome] mount failed', slotId, err); });
  }

  // Header rec ids that need t396_init / t1003_init / t1093__init to render correctly.
  // (We force these after mount in case the inline scripts inside the chrome HTML
  // didn't get a chance to run before the bundle loaded.)
  var HEADER_RECS_T396 = ['853550221', '841567060', '841567062'];
  var HEADER_REC_T1003 = '1157755106';
  var HEADER_RECS_T1093 = ['841567061', '841567063'];
  // Footer T396 records: 890778214 (desktop partners bitmap), 890781301 (mobile partners),
  // 824824359 (bottom row — socials, legal, become-our-partner, copyright, newsletter).
  var FOOTER_RECS_T396 = ['890778214', '890781301', '824824359'];

  function callIfExists(fn /*, ...args */) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (typeof window[fn] === 'function') {
      try { window[fn].apply(window, args); } catch (e) { console.warn('[citf chrome]', fn, e); }
    }
  }

  function reinitTildaBlocks() {
    // ticker
    callIfExists('t1003_init', HEADER_REC_T1003, '');
    // nav rec blocks (logo+menu, mobile menu, social/buy)
    HEADER_RECS_T396.concat(FOOTER_RECS_T396).forEach(function (id) {
      callIfExists('t396_initialScale', id);
      callIfExists('t396_init', id);
    });
    // mobile menu popups
    HEADER_RECS_T1093.forEach(function (id) {
      callIfExists('t1093__init', id);
      callIfExists('t1093__initPopup', id);
    });
  }

  // Intercept Tilda's lang switcher (which redirects to /ru/ /gr/ paths) so
  // it stays on this page and toggles our data-lang i18n instead.
  var LS_KEY = 'citf_lang';
  var VALID_LANGS = ['en', 'ru', 'gr'];
  function setLang(l) {
    if (VALID_LANGS.indexOf(l) < 0) l = 'en';
    document.documentElement.setAttribute('data-lang', l);
    try { localStorage.setItem(LS_KEY, l); } catch (e) {}
    document.documentElement.lang = (l === 'gr') ? 'el' : l;
    var u = new URL(location.href);
    if (l === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', l);
    history.replaceState(null, '', u.toString());
    document.querySelectorAll('.citf-navlangs button, [data-citf-setlang]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-citf-setlang') === l);
    });
  }
  window.__citfSetLang = setLang;

  function initialLang() {
    var q = (new URL(location.href)).searchParams.get('lang');
    if (q && VALID_LANGS.indexOf(q) >= 0) return q;
    var saved; try { saved = localStorage.getItem(LS_KEY); } catch (e) {}
    if (saved && VALID_LANGS.indexOf(saved) >= 0) return saved;
    var b = (navigator.language || '').toLowerCase();
    if (b.indexOf('ru') === 0) return 'ru';
    if (b.indexOf('el') === 0) return 'gr';
    return 'en';
  }

  function bindLangSwitcher() {
    // Tilda lang switcher uses [data-tilda-lang] or hrefs like /ru/, /gr/, /
    var langButtons = document.querySelectorAll('[data-tilda-lang], a[href="/ru/"], a[href="/gr/"], a[href="/en/"]');
    langButtons.forEach(function (el) {
      // figure out target lang
      var t = el.getAttribute('data-tilda-lang');
      if (!t) {
        var h = el.getAttribute('href') || '';
        if (h === '/ru/' || h === '/ru') t = 'ru';
        else if (h === '/gr/' || h === '/gr') t = 'gr';
        else if (h === '/en/' || h === '/en') t = 'en';
      }
      if (!t) return;
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        setLang(t);
      }, true);
    });
  }

  // Vercel Web Analytics — drop in once via the standard inline script.
  // Documented at https://vercel.com/docs/analytics/quickstart for non-Next sites.
  function injectAnalytics() {
    if (document.querySelector('script[src="/_vercel/insights/script.js"]')) return;
    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
  }

  // Append UTM tags to outbound ticket-vendor / partnership links so we can
  // attribute conversions back to the originating page in analytics.
  function addUtmToCtas() {
    var page = location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'home';
    var TARGETS = ['soldoutticketbox.com', 'partnership.citf.cy', 'partnership.citf.cy/quiz'];
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      // Only annotate full external URLs we recognize
      if (!TARGETS.some(function (t) { return href.indexOf(t) >= 0; })) return;
      try {
        var u = new URL(href, location.origin);
        if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'citf.cy');
        if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'site');
        if (!u.searchParams.has('utm_campaign')) u.searchParams.set('utm_campaign', page);
        a.setAttribute('href', u.toString());
      } catch (e) { /* ignore malformed urls */ }
    });
  }

  async function boot() {
    // 0) i18n CSS + initial language SYNCHRONOUSLY so the page never flashes
    //    all three language versions.
    injectInlineCSS();
    setLang(initialLang());
    // 0.7) Floating Buy Ticket FAB if page configured one (instant, no chrome dep)
    injectBuyFab();

    // 1) Tilda parent DOM (body.t-body + #allrecords wrapper)
    prepareBody();
    ensureAllrecords();

    // 2) Tilda CSS bundles (parallel, non-blocking)
    injectAllCSS();

    // 3) Mount header + footer IMMEDIATELY — do NOT wait for the heavy Tilda
    //    JS bundle. The static HTML + CSS render the chrome correctly on its
    //    own; Tilda JS only adds extra interactivity (animations, popups) that
    //    we re-init in the background once it loads.
    await Promise.all([
      mountFragment('citf-header-mount', '/components/header.html'),
      mountFragment('citf-footer-mount', '/components/footer.html')
    ]);
    // 3.1) Pre-populate window.tn['ab<recid>'] with the screens array read from
    //      each artboard's data attribute. This stops Tilda's resize observer
    //      (in tilda-zero-1.1.min.js) from crashing on the first ticks before
    //      t396_init has fired for each rec. The full settings get overwritten
    //      by t396_init later — we just need a non-undefined .screens here.
    preStubArtboards();
    // 3.2) Tilda's t396 resize loop wraps each rec in try/catch and logs to
    //      console.error. rec824824359 (the bottom-footer copyright/socials
    //      block) is missing some Tilda field data in our export and throws
    //      every animation frame — flooding the console without affecting
    //      what the user sees. Filter just that noise; let real errors through.
    silenceKnownTildaNoise();
    // 3.5) Inject our adaptive partners block between page content and footer,
    //      and move the lang pill into the nav (right next to the social icons).
    injectPartnersBlock();
    swapMobileLogo();
    bindFooterButtons();
    bindMenuButton();
    attachLangSwitcherToNav();
    injectAnalytics();
    addUtmToCtas();
    // Re-run UTM tagging once the chrome HTML lands (footer has more anchors)
    setTimeout(addUtmToCtas, 800);
    setTimeout(addUtmToCtas, 1800);
    // 3.6) If for some reason the lang pill couldn't be attached to the nav,
    //      show the floating fallback (only after a short delay so it never
    //      flashes when chrome attaches normally).
    setTimeout(function () {
      if (!document.querySelector('.citf-navlangs')) injectFallbackLangPill();
    }, 600);

    // 4) Apply language again now that all i18n nodes are in DOM
    setLang(initialLang());
    bindLangSwitcher();

    // 5) NOW load Tilda JS in the background. The chrome is already visible;
    //    when the bundle resolves we re-init blocks (animations, popups, scale).
    loadTildaJS()
      .then(function () {
        setTimeout(function () {
          reinitTildaBlocks();
          bindLangSwitcher();
          repinLangPill();
        }, 50);
      })
      .catch(function (e) { console.warn('[citf chrome] tilda bundle load error', e); });

    window.addEventListener('resize', function () { reinitTildaBlocks(); repinLangPill(); });
    // The MENU button is position:fixed on mobile, so it doesn't actually
    // change position on scroll — but our pill might not have been pinned
    // yet when the page first loaded. Re-pin on first scroll just in case.
    var pinnedOnScroll = false;
    window.addEventListener('scroll', function () {
      if (pinnedOnScroll) return;
      pinnedOnScroll = true;
      repinLangPill();
    }, { passive: true });
    if (document.readyState === 'complete') {
      setTimeout(function(){ reinitTildaBlocks(); repinLangPill(); }, 200);
    } else {
      window.addEventListener('load', function () {
        setTimeout(function(){ reinitTildaBlocks(); repinLangPill(); }, 200);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
