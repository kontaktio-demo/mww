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
    document.dispatchEvent(new CustomEvent('mww:mww-prefs', { detail: prefs }));
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
    wrap.id = 'mwwPrefsBox';
    wrap.className = 'mww-prefs';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-labelledby', 'mwwPrefsTitle');
    wrap.setAttribute('aria-describedby', 'mwwPrefsDesc');
    wrap.innerHTML = ''
      + '<div class="mww-prefs-inner">'
      + '  <div class="mww-prefs-text">'
      + '    <strong id="mwwPrefsTitle">Pliki cookies</strong>'
      + '    <p id="mwwPrefsDesc">Używamy plików cookies, aby zapewnić działanie strony oraz - za Twoją zgodą - mierzyć ruch (analityczne) i&nbsp;personalizować treści (marketingowe). Możesz zaakceptować wszystkie, odmówić zgody na opcjonalne lub dostosować wybór. Szczegóły: <a href="polityka-prywatnosci.html">Polityka Prywatności</a>.</p>'
      + '  </div>'
      + '  <div class="mww-prefs-actions">'
      + '    <button type="button" id="mwwPrefsCustomize" class="mww-prefs-btn mww-prefs-btn-equal">Dostosuj</button>'
      + '    <button type="button" id="mwwPrefsReject" class="mww-prefs-btn mww-prefs-btn-equal">Odmów</button>'
      + '    <button type="button" id="mwwPrefsAccept" class="mww-prefs-btn mww-prefs-btn-equal">Akceptuj wszystkie</button>'
      + '  </div>'
      + '</div>'
      + '<div id="mwwPrefsPanel" class="mww-prefs-panel" hidden>'
      + '  <div class="mww-prefs-checks">'
      + '    <label class="mww-prefs-check">'
      + '      <input type="checkbox" checked disabled aria-label="Niezbędne (zawsze włączone)">'
      + '      <span><strong>Niezbędne</strong> - wymagane do działania strony (zawsze włączone, zapis preferencji cookies).</span>'
      + '    </label>'
      + '    <label class="mww-prefs-check">'
      + '      <input type="checkbox" id="mwwPrefsAnalytics">'
      + '      <span><strong>Analityczne</strong> - Google Analytics 4, Google Tag Manager. Pomagają nam zrozumieć, jak korzystasz ze strony.</span>'
      + '    </label>'
      + '    <label class="mww-prefs-check">'
      + '      <input type="checkbox" id="mwwPrefsMarketing">'
      + '      <span><strong>Marketingowe</strong> - Meta Pixel, Google Ads. Mierzymy skuteczność kampanii i&nbsp;dopasowujemy treści.</span>'
      + '    </label>'
      + '  </div>'
      + '  <div class="mww-prefs-actions mww-prefs-actions-panel">'
      + '    <button type="button" id="mwwPrefsSave" class="mww-prefs-btn mww-prefs-btn-equal">Zapisz preferencje</button>'
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
    const panel = banner.querySelector('#mwwPrefsPanel');
    const aBox = banner.querySelector('#mwwPrefsAnalytics');
    const mBox = banner.querySelector('#mwwPrefsMarketing');

    banner.querySelector('#mwwPrefsAccept').addEventListener('click', () => {
      writeConsent({ analytics: true, marketing: true });
      hide(banner);
    });
    banner.querySelector('#mwwPrefsReject').addEventListener('click', () => {
      writeConsent({ analytics: false, marketing: false });
      hide(banner);
    });
    banner.querySelector('#mwwPrefsCustomize').addEventListener('click', () => {
      panel.hidden = !panel.hidden;
    });
    banner.querySelector('#mwwPrefsSave').addEventListener('click', () => {
      writeConsent({ analytics: aBox.checked, marketing: mBox.checked });
      hide(banner);
    });
  }

  function show(banner, preFill) {
    const aBox = banner.querySelector('#mwwPrefsAnalytics');
    const mBox = banner.querySelector('#mwwPrefsMarketing');
    if (aBox) aBox.checked = !!(preFill && preFill.analytics);
    if (mBox) mBox.checked = !!(preFill && preFill.marketing);
    requestAnimationFrame(() => banner.classList.add('show'));
  }

  function hide(banner) {
    banner.classList.remove('show');
    const panel = banner.querySelector('#mwwPrefsPanel');
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
    b.querySelector('#mwwPrefsPanel').hidden = false;
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
