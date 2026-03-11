const initMenu = () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  if (!toggle || !nav) return;

  const mobileMedia = window.matchMedia('(max-width: 780px)');
  if (!nav.id) nav.id = 'site-navigation';
  toggle.setAttribute('aria-controls', nav.id);

  const syncMenuState = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.hidden = mobileMedia.matches ? !open : false;
  };

  const syncViewportState = () => {
    syncMenuState(mobileMedia.matches ? nav.classList.contains('open') : false);
    if (!mobileMedia.matches) {
      nav.classList.remove('open');
    }
  };

  toggle.addEventListener('click', () => {
    syncMenuState(!nav.classList.contains('open'));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => syncMenuState(false));
  });

  document.addEventListener('click', (event) => {
    if (!mobileMedia.matches || !nav.classList.contains('open')) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    syncMenuState(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      syncMenuState(false);
      toggle.focus();
    }
  });

  if (typeof mobileMedia.addEventListener === 'function') {
    mobileMedia.addEventListener('change', syncViewportState);
  } else {
    mobileMedia.addListener(syncViewportState);
  }

  syncViewportState();
};

const initCookieBanner = () => {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;

  const storageKey = 'webservice_cookie_consent';
  const acceptButton = banner.querySelector('[data-cookie-accept]');
  const declineButton = banner.querySelector('[data-cookie-decline]');
  const manageButtons = document.querySelectorAll('[data-cookie-open]');
  const GA_MEASUREMENT_ID = 'G-G20B10NL3Q';

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

const initLeadForms = () => {
  const forms = document.querySelectorAll('.offer-form');
  if (!forms.length) return;

  const webhookUrl = 'https://hook.eu2.make.com/1xxbdgempookm7ht52gbk5fxamw8iknm';
  const normalizeUrl = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  forms.forEach((form) => {
    const submitButton = form.querySelector('button[type="submit"]');
    const submitLabel = submitButton?.textContent;
    const urlInput = form.querySelector('input[name="url"]');
    let status = form.querySelector('[data-form-status]');

    if (!status) {
      status = document.createElement('p');
      status.className = 'form-status';
      status.setAttribute('data-form-status', '');
      status.setAttribute('aria-live', 'polite');
      form.appendChild(status);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      if (typeof payload.url === 'string') {
        payload.url = normalizeUrl(payload.url);
      }
      payload.page = window.location.pathname;
      payload.source = form.dataset.formSource || 'website';

      status.textContent = 'Wird gesendet...';
      status.dataset.state = 'loading';
      status.hidden = false;
      submitButton?.setAttribute('disabled', 'disabled');
      if (submitButton) submitButton.textContent = 'Wird gesendet...';

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Webhook responded with ${response.status}`);
        }

        form.reset();
        status.textContent = 'Danke. Die Anfrage wurde erfolgreich gesendet.';
        status.dataset.state = 'success';
        status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch (error) {
        status.textContent = 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder schreiben Sie per E-Mail.';
        status.dataset.state = 'error';
        status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } finally {
        submitButton?.removeAttribute('disabled');
        if (submitButton && submitLabel) submitButton.textContent = submitLabel;
      }
    });

    urlInput?.addEventListener('blur', () => {
      urlInput.value = normalizeUrl(urlInput.value);
    });
  });
};

initMenu();
initCookieBanner();
initLeadForms();
