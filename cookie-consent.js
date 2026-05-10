'use strict';

(function () {
  const STORAGE_KEY = 'mww_cookie_consent';
  const TTL_MS = 365 * 24 * 60 * 60 * 1000;

  function readConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.timestamp || (Date.now() - parsed.timestamp) > TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch (_) { return null; }
  }

  function writeConsent(partial) {
    const data = {
      necessary: true,
      analytics: !!partial.analytics,
      marketing: !!partial.marketing,
      timestamp: Date.now()
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
    applyConsent(data);
    return data;
  }

  function applyConsent(prefs) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'cookie_consent_update',
      analytics_storage: prefs.analytics ? 'granted' : 'denied',
      ad_storage: prefs.marketing ? 'granted' : 'denied',
      ad_user_data: prefs.marketing ? 'granted' : 'denied',
      ad_personalization: prefs.marketing ? 'granted' : 'denied'
    });
    if (prefs.analytics) loadAnalytics();
    if (prefs.marketing) loadMarketing();
    document.dispatchEvent(new CustomEvent('mww:cookie-consent', { detail: prefs }));
  }

  function loadAnalytics() {
    if (window.__mwwAnalyticsLoaded) return;
    window.__mwwAnalyticsLoaded = true;
    document.dispatchEvent(new CustomEvent('mww:analytics-load'));
  }

  function loadMarketing() {
    if (window.__mwwMarketingLoaded) return;
    window.__mwwMarketingLoaded = true;
    document.dispatchEvent(new CustomEvent('mww:marketing-load'));
  }

  function buildBanner() {
    const wrap = document.createElement('div');
    wrap.id = 'cookieConsent';
    wrap.className = 'cookie-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-labelledby', 'cookieTitle');
    wrap.setAttribute('aria-describedby', 'cookieDesc');
    wrap.innerHTML = ''
      + '<div class="cookie-inner">'
      + '  <div class="cookie-text">'
      + '    <strong id="cookieTitle">Pliki cookies</strong>'
      + '    <p id="cookieDesc">Używamy plików cookies, aby zapewnić działanie strony oraz - za Twoją zgodą - mierzyć ruch (analityczne) i&nbsp;personalizować treści (marketingowe). Możesz zaakceptować wszystkie, odmówić zgody na opcjonalne lub dostosować wybór. Szczegóły: <a href="polityka-prywatnosci.html">Polityka Prywatności</a>.</p>'
      + '  </div>'
      + '  <div class="cookie-actions">'
      + '    <button type="button" id="cookieCustomize" class="cookie-btn cookie-btn-equal">Dostosuj</button>'
      + '    <button type="button" id="cookieReject" class="cookie-btn cookie-btn-equal">Odmów</button>'
      + '    <button type="button" id="cookieAccept" class="cookie-btn cookie-btn-equal">Akceptuj wszystkie</button>'
      + '  </div>'
      + '</div>'
      + '<div id="cookieCustomPanel" class="cookie-custom-panel" hidden>'
      + '  <div class="cookie-checks">'
      + '    <label class="cookie-check">'
      + '      <input type="checkbox" checked disabled aria-label="Niezbędne (zawsze włączone)">'
      + '      <span><strong>Niezbędne</strong> - wymagane do działania strony (zawsze włączone, zapis preferencji cookies).</span>'
      + '    </label>'
      + '    <label class="cookie-check">'
      + '      <input type="checkbox" id="cookieAnalytics">'
      + '      <span><strong>Analityczne</strong> - Google Analytics 4, Google Tag Manager. Pomagają nam zrozumieć, jak korzystasz ze strony.</span>'
      + '    </label>'
      + '    <label class="cookie-check">'
      + '      <input type="checkbox" id="cookieMarketing">'
      + '      <span><strong>Marketingowe</strong> - Meta Pixel, Google Ads. Mierzymy skuteczność kampanii i&nbsp;dopasowujemy treści.</span>'
      + '    </label>'
      + '  </div>'
      + '  <div class="cookie-actions cookie-actions-panel">'
      + '    <button type="button" id="cookieSave" class="cookie-btn cookie-btn-equal">Zapisz preferencje</button>'
      + '  </div>'
      + '</div>';
    return wrap;
  }

  let bannerInstance = null;

  function ensureBanner() {
    if (bannerInstance && document.body && document.body.contains(bannerInstance)) {
      return bannerInstance;
    }
    bannerInstance = buildBanner();
    document.body.appendChild(bannerInstance);
    bindBanner(bannerInstance);
    return bannerInstance;
  }

  function bindBanner(banner) {
    const panel = banner.querySelector('#cookieCustomPanel');
    const aBox = banner.querySelector('#cookieAnalytics');
    const mBox = banner.querySelector('#cookieMarketing');

    banner.querySelector('#cookieAccept').addEventListener('click', () => {
      writeConsent({ analytics: true, marketing: true });
      hide(banner);
    });
    banner.querySelector('#cookieReject').addEventListener('click', () => {
      writeConsent({ analytics: false, marketing: false });
      hide(banner);
    });
    banner.querySelector('#cookieCustomize').addEventListener('click', () => {
      panel.hidden = !panel.hidden;
    });
    banner.querySelector('#cookieSave').addEventListener('click', () => {
      writeConsent({ analytics: aBox.checked, marketing: mBox.checked });
      hide(banner);
    });
  }

  function show(banner, preFill) {
    const aBox = banner.querySelector('#cookieAnalytics');
    const mBox = banner.querySelector('#cookieMarketing');
    if (aBox) aBox.checked = !!(preFill && preFill.analytics);
    if (mBox) mBox.checked = !!(preFill && preFill.marketing);
    requestAnimationFrame(() => banner.classList.add('show'));
  }

  function hide(banner) {
    banner.classList.remove('show');
    const panel = banner.querySelector('#cookieCustomPanel');
    if (panel) panel.hidden = true;
  }

  function bindSettingsTriggers() {
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-cookie-settings]');
      if (!t) return;
      e.preventDefault();
      window.mwwOpenCookieSettings();
    });
  }

  window.mwwOpenCookieSettings = function () {
    const current = readConsent() || { analytics: false, marketing: false };
    const b = ensureBanner();
    b.querySelector('#cookieCustomPanel').hidden = false;
    show(b, current);
  };

  function updateCopyrightYear() {
    const y = document.getElementById('copyright-year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function init() {
    const existing = readConsent();
    if (existing) {
      applyConsent(existing);
    } else {
      const b = ensureBanner();
      setTimeout(() => show(b, { analytics: false, marketing: false }), 600);
    }
    bindSettingsTriggers();
    updateCopyrightYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
