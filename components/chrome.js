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

      /* lang pill placed inside the Tilda header, just left of the social icons */
      ".citf-navlangs.in-nav{position:absolute;top:60px;right:230px;z-index:120;background:rgba(14,14,14,0.85);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}" +
      "@media(max-width:1439px){.citf-navlangs.in-nav{top:34px;right:200px}}" +
      "@media(max-width:980px){.citf-navlangs.in-nav{top:28px;right:170px}}" +
      "@media(max-width:640px){.citf-navlangs.in-nav{top:18px;right:140px;padding:2px 3px}.citf-navlangs.in-nav button{font-size:10px;padding:4px 7px;letter-spacing:0.14em}}" +
      "@media(max-width:380px){.citf-navlangs.in-nav{right:120px;top:14px}}" +

      /* floating Buy Ticket button — bottom-right, configurable per page via window.CITF_BUY */
      ".citf-buyfab{position:fixed;bottom:22px;right:22px;z-index:9998;display:inline-flex;align-items:center;gap:8px;background:#FFA806;color:#000 !important;font-family:'Syne',Arial,sans-serif;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;font-weight:800;padding:14px 22px;border-radius:999px;text-decoration:none !important;box-shadow:0 8px 28px rgba(255,168,6,0.35),0 4px 12px rgba(0,0,0,0.4);transition:transform 0.15s ease,background 0.15s ease}" +
      ".citf-buyfab:hover{background:#ffbd38;transform:translateY(-2px)}" +
      ".citf-buyfab svg{width:14px;height:14px;fill:currentColor}" +
      ".citf-buyfab small{display:block;font-size:9px;letter-spacing:0.14em;color:rgba(0,0,0,0.6);font-weight:600;margin-top:2px;text-transform:none}" +
      ".citf-buyfab-inner{display:flex;flex-direction:column;align-items:flex-start}" +
      "@media(max-width:520px){.citf-buyfab{bottom:14px;right:14px;padding:12px 16px;font-size:11px;letter-spacing:0.12em}}" +

      /* hide Tilda's flat partners bitmap — replaced by adaptive HTML grid below */
      "img[imgfield='tn_img_1741704123132']{display:none !important}" +
      "img[imgfield='tn_img_1741704123132']+*{display:none !important}" +

      /* CITF partners — adaptive HTML grid using individual logo PNGs.
         Sits between page content and the Tilda footer; site-wide via chrome.js. */
      ".citf-partners{padding:64px 32px 48px;background:#181818;border-top:1px solid #232323}" +
      ".citf-partners-inner{max-width:1280px;margin:0 auto}" +
      ".citf-partners-title{display:block;text-align:center;font-family:'Syne',Arial,sans-serif;font-size:11px;letter-spacing:0.28em;color:#737373;text-transform:uppercase;margin-bottom:48px;font-weight:600}" +
      ".citf-partners-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:42px 56px;margin-bottom:48px}" +
      ".citf-partners-row.main .citf-partner-logo{height:88px}" +
      ".citf-partners-row.rest{gap:32px 44px;margin-bottom:0}" +
      ".citf-partners-row.rest .citf-partner-logo{height:48px}" +
      ".citf-partner{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:0}" +
      ".citf-partner-role{font-family:'Syne',Arial,sans-serif;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#737373;font-weight:600;text-align:center;line-height:1.4;max-width:160px}" +
      ".citf-partners-row.main .citf-partner-role{font-size:10px;max-width:240px}" +
      ".citf-partner-logo{display:block;width:auto;max-width:180px;object-fit:contain;filter:brightness(1) contrast(1)}" +
      "@media(max-width:760px){" +
        ".citf-partners{padding:48px 22px 36px}" +
        ".citf-partners-title{margin-bottom:32px}" +
        ".citf-partners-row{gap:32px 36px;margin-bottom:32px}" +
        ".citf-partners-row.main .citf-partner-logo{height:64px}" +
        ".citf-partners-row.rest{gap:24px 28px}" +
        ".citf-partners-row.rest .citf-partner-logo{height:38px}" +
      "}" +
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

  // After chrome mounts, place the lang pill INSIDE the Tilda header — visually
  // right next to (just left of) the social icons. Tilda absolutely-positions
  // its nav elements, so we use a CSS class (.in-nav) with absolute positioning
  // anchored to the header's top-right area.
  function attachLangSwitcherToNav() {
    if (document.querySelector('.citf-navlangs.in-nav')) return;
    var header = document.getElementById('t-header');
    if (!header) return;
    // Make sure header is the positioning context for our absolute pill
    var cs = window.getComputedStyle(header);
    if (cs.position === 'static') header.style.position = 'relative';
    var pill = makeLangPillElement('in-nav');
    header.appendChild(pill);
    var floating = document.querySelector('.citf-navlangs.floating');
    if (floating) floating.remove();
    setLang(initialLang());
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
  }

  // CITF partners — adaptive HTML grid. ADD/REMOVE partners by editing this array;
  // logos live in /images/partners/<file>. Mark `main: true` for the larger top row.
  // Roles use the trilingual {en, ru, gr} object.
  var PARTNERS = [
    { file:'mayor-of-limassol', alt:'Mayor of Limassol', main:true,
      role:{ en:'Under the Auspices of the Mayor of Limassol', ru:'Под патронажем мэра Лимассола', gr:'Υπό την Αιγίδα του Δημάρχου Λεμεσού' } },
    { file:'pattihio', alt:'Pattihio Municipal Theatre', main:true,
      role:{ en:'Main Partner', ru:'Главный партнёр', gr:'Κύριος Συνεργάτης' } },

    { file:'asg-leasing', alt:'ASG Leasing',
      role:{ en:'Sponsor', ru:'Спонсор', gr:'Χορηγός' } },
    { file:'cyprus-airways', alt:'Cyprus Airways',
      role:{ en:'Official Flight Partner', ru:'Авиаперевозчик', gr:'Επίσημος Αεροπορικός Συνεργάτης' } },
    { file:'filelefteros', alt:'Ο Φιλελεύθερος',
      role:{ en:'Media Partner', ru:'Медиа-партнёр', gr:'Χορηγός Επικοινωνίας' } },
    { file:'zima', alt:'ZIMA Magazine',
      role:{ en:'Media Partner', ru:'Медиа-партнёр', gr:'Χορηγός Επικοινωνίας' } },
    { file:'etko', alt:'ETKO',
      role:{ en:'Venue', ru:'Площадка', gr:'Χώρος' } },
    { file:'crowne-plaza', alt:'Crowne Plaza Limassol',
      role:{ en:'Official Hotel', ru:'Официальный отель', gr:'Επίσημο Ξενοδοχείο' } },
    { file:'allegro', alt:'Allegro',
      role:{ en:'Event Partner', ru:'Партнёр события', gr:'Συνεργάτης Εκδήλωσης' } },
    { file:'commandaria', alt:'Commandaria Orchestra',
      role:{ en:'Orchestra', ru:'Оркестр', gr:'Ορχήστρα' } },
    { file:'be-bloomy', alt:'Be Bloomy',
      role:{ en:'Flowers', ru:'Цветы', gr:'Λουλούδια' } },
    { file:'aya-cooks', alt:'AYA Cooks',
      role:{ en:'Event Partner', ru:'Партнёр события', gr:'Συνεργάτης Εκδήλωσης' } }
  ];

  function makePartnerCard(p) {
    return '' +
      '<div class="citf-partner">' +
        '<img class="citf-partner-logo" src="/images/partners/'+ p.file +'.png" alt="'+ p.alt +'" loading="lazy">' +
        '<span class="citf-partner-role" data-en>'+ p.role.en +'</span>' +
        '<span class="citf-partner-role" data-ru>'+ p.role.ru +'</span>' +
        '<span class="citf-partner-role" data-gr>'+ p.role.gr +'</span>' +
      '</div>';
  }

  function injectPartnersBlock() {
    if (document.querySelector('.citf-partners')) return;
    var sec = document.createElement('section');
    sec.className = 'citf-partners';
    var inner = document.createElement('div');
    inner.className = 'citf-partners-inner';

    var title = document.createElement('span');
    title.className = 'citf-partners-title';
    title.innerHTML =
      '<span data-en>With the support of</span>' +
      '<span data-ru>При поддержке</span>' +
      '<span data-gr>Με την υποστήριξη</span>';
    inner.appendChild(title);

    var mainRow = document.createElement('div');
    mainRow.className = 'citf-partners-row main';
    var restRow = document.createElement('div');
    restRow.className = 'citf-partners-row rest';
    PARTNERS.forEach(function (p) {
      (p.main ? mainRow : restRow).insertAdjacentHTML('beforeend', makePartnerCard(p));
    });
    inner.appendChild(mainRow);
    inner.appendChild(restRow);
    sec.appendChild(inner);

    // Insert just before the footer mount so it lives BETWEEN page content and the Tilda footer
    var footerMount = document.getElementById('citf-footer-mount') || document.getElementById('t-footer');
    if (footerMount && footerMount.parentNode) {
      footerMount.parentNode.insertBefore(sec, footerMount);
    } else {
      var ar = document.getElementById('allrecords') || document.body;
      ar.appendChild(sec);
    }
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
  var FOOTER_RECS_T396 = ['890778214', '890781301'];

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
    // 3.5) Inject our adaptive partners block between page content and footer,
    //      and move the lang pill into the nav (right next to the social icons).
    injectPartnersBlock();
    attachLangSwitcherToNav();
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
        }, 50);
      })
      .catch(function (e) { console.warn('[citf chrome] tilda bundle load error', e); });

    window.addEventListener('resize', function () { reinitTildaBlocks(); });
    if (document.readyState === 'complete') {
      setTimeout(reinitTildaBlocks, 200);
    } else {
      window.addEventListener('load', function () { setTimeout(reinitTildaBlocks, 200); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
