const initMenu = () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  if (!toggle || !nav) return;

  const syncMenuState = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  toggle.addEventListener('click', () => {
    syncMenuState(!nav.classList.contains('open'));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => syncMenuState(false));
  });
};

const initCookieBanner = () => {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;

  const storageKey = 'webservice_cookie_consent';
  const acceptButton = banner.querySelector('[data-cookie-accept]');
  const declineButton = banner.querySelector('[data-cookie-decline]');
  const manageButtons = document.querySelectorAll('[data-cookie-open]');
  const GA_MEASUREMENT_ID = '';

  const loadAnalytics = () => {
    if (!GA_MEASUREMENT_ID || window.gtag) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  };

  const applyConsent = (consent) => {
    if (consent === 'accepted') {
      loadAnalytics();
      banner.hidden = true;
      return;
    }

    if (consent === 'declined') {
      banner.hidden = true;
      return;
    }

    banner.hidden = false;
  };

  const storedConsent = window.localStorage.getItem(storageKey);
  applyConsent(storedConsent);

  acceptButton?.addEventListener('click', () => {
    window.localStorage.setItem(storageKey, 'accepted');
    applyConsent('accepted');
  });

  declineButton?.addEventListener('click', () => {
    window.localStorage.setItem(storageKey, 'declined');
    applyConsent('declined');
  });

  manageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      window.localStorage.removeItem(storageKey);
      applyConsent(null);
    });
  });
};

initMenu();
initCookieBanner();
