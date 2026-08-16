const getLocale = () => (document.documentElement.lang || '').toLowerCase().startsWith('en') ? 'en' : 'de';

const getLanguageTargets = () => {
  const pathname = window.location.pathname || '/';
  const isEnglish = pathname.endsWith('-en.html');

  if (pathname === '/' || pathname.endsWith('/index.html')) {
    return {
      current: isEnglish ? 'en' : 'de',
      de: pathname === '/' ? '/' : pathname,
      en: pathname === '/' ? '/index-en.html' : pathname.replace(/index\.html$/, 'index-en.html'),
    };
  }

  if (pathname.endsWith('/')) {
    return {
      current: 'de',
      de: pathname,
      en: `${pathname}index-en.html`,
    };
  }

  if (isEnglish) {
    return {
      current: 'en',
      de: pathname.replace(/-en\.html$/, '.html'),
      en: pathname,
    };
  }

  if (pathname.endsWith('.html')) {
    return {
      current: 'de',
      de: pathname,
      en: pathname.replace(/\.html$/, '-en.html'),
    };
  }

  return {
    current: getLocale(),
    de: pathname,
    en: pathname,
  };
};

const initLanguageSwitch = () => {
  const footerGrid = document.querySelector('.footer-grid');
  if (!footerGrid || footerGrid.querySelector('.language-switch')) return;

  const locale = getLocale();
  const targets = getLanguageTargets();
  const wrapper = document.createElement('div');
  wrapper.className = 'language-switch-wrap';

  const heading = document.createElement('h4');
  heading.textContent = locale === 'en' ? 'Language' : 'Sprache';

  const switcher = document.createElement('div');
  switcher.className = 'language-switch';
  switcher.setAttribute('aria-label', locale === 'en' ? 'Language switch' : 'Sprachwechsel');

  const deLink = document.createElement('a');
  deLink.href = targets.de;
  deLink.textContent = 'DE';
  if (targets.current === 'de') deLink.classList.add('is-active');

  const enLink = document.createElement('a');
  enLink.href = targets.en;
  enLink.textContent = 'EN';
  if (targets.current === 'en') enLink.classList.add('is-active');

  switcher.append(deLink, enLink);
  wrapper.append(heading, switcher);
  footerGrid.appendChild(wrapper);
};

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

const getCookieBannerConfig = () => {
  const locale = getLocale();

  if (locale === 'en') {
    return {
      acceptLabel: 'Accept all',
      declineLabel: 'Necessary only',
      manageLabel: 'Learn more and adjust',
      privacyHref: '/datenschutz-en.html',
      reopenLabel: 'Open cookie settings',
      message:
        'We use necessary cookies and optional analytics to improve this website. You can accept all cookies or stay with the necessary ones only.',
    };
  }

  return {
    acceptLabel: 'Zustimmen',
    declineLabel: 'Ablehnen',
    manageLabel: 'Mehr erfahren und anpassen',
    privacyHref: '/datenschutz.html',
    reopenLabel: 'Cookie-Einstellungen öffnen',
    message:
      'Wir nutzen notwendige Cookies und optionale Analysen, um diese Website zu verbessern. Sie können alle Cookies akzeptieren oder nur bei den notwendigen bleiben.',
  };
};

const createCookieReopenButton = (label) => {
  const reopenButton = document.createElement('button');
  reopenButton.className = 'cookie-reopen';
  reopenButton.hidden = true;
  reopenButton.type = 'button';
  reopenButton.setAttribute('data-cookie-open', '');
  reopenButton.setAttribute('aria-label', label);
  reopenButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3db87a"><path d="M12 1C8.69 1 6 3.69 6 7c0 2.05 1.05 3.86 2.66 4.94L7 22h10l-1.66-10.06C16.95 10.86 18 9.05 18 7c0-3.31-2.69-6-6-6z"/></svg>';
  return reopenButton;
};

const createCookieBannerMarkup = ({
  acceptLabel,
  declineLabel,
  manageLabel,
  message,
  privacyHref,
}) => `
  <div class="cookie-banner__modal">
    <div class="cookie-banner__copy">
      <p>${message}</p>
    </div>
    <div class="cookie-banner__actions">
      <button class="cookie-btn cookie-btn--primary" type="button" data-cookie-decline>${declineLabel}</button>
      <button class="cookie-btn cookie-btn--primary" type="button" data-cookie-accept>${acceptLabel}</button>
    </div>
    <div class="cookie-banner__more">
      <a class="cookie-btn cookie-btn--secondary" href="${privacyHref}">${manageLabel}</a>
    </div>
  </div>
`;

const ensureCookieBanner = () => {
  const config = getCookieBannerConfig();
  let banner = document.querySelector('[data-cookie-banner]');

  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.hidden = true;
    banner.setAttribute('data-cookie-banner', '');
    document.body.appendChild(banner);
  } else {
    banner.className = 'cookie-banner';
    banner.hidden = true;
  }

  banner.innerHTML = createCookieBannerMarkup(config);

  let reopenButton = document.querySelector('[data-cookie-open]');
  if (!reopenButton) {
    reopenButton = createCookieReopenButton(config.reopenLabel);
    document.body.appendChild(reopenButton);
  } else {
    reopenButton.setAttribute('aria-label', config.reopenLabel);
  }

  return { banner, reopenButton };
};

const initCookieBanner = () => {
  const { banner, reopenButton } = ensureCookieBanner();

  const storageKey = 'webservice_cookie_consent';
  const acceptButton = banner.querySelector('[data-cookie-accept]');
  const declineButtons = banner.querySelectorAll('[data-cookie-decline]');
  const manageButtons = document.querySelectorAll('[data-cookie-open]');
  let analyticsTrackingInitialized = false;

  const initAnalyticsTracking = () => {
    if (analyticsTrackingInitialized) return;
    analyticsTrackingInitialized = true;

    // Contact click tracking — nav CTA, hero button, section CTAs
    document.querySelectorAll(
      'a[href="anfrage.html"], a[href$="/anfrage.html"], a[href="#contact"], .nav-cta'
    ).forEach((el) => {
      el.addEventListener('click', () => {
        window.gtag?.('event', 'contact_click', {
          event_category: 'engagement',
          event_label: (el.textContent?.trim() || el.getAttribute('href') || '').slice(0, 100),
          page_path: window.location.pathname,
        });
      });
    });

    // Scroll depth milestones — 25 / 50 / 75 / 90 %
    const scrollMilestones = [25, 50, 75, 90];
    const reachedMilestones = new Set();

    const trackScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (!docHeight) return;
      const pct = Math.round((window.scrollY / docHeight) * 100);
      scrollMilestones.forEach((milestone) => {
        if (pct >= milestone && !reachedMilestones.has(milestone)) {
          reachedMilestones.add(milestone);
          window.gtag?.('event', 'scroll_depth', {
            event_category: 'engagement',
            event_label: `${milestone}%`,
            value: milestone,
            page_path: window.location.pathname,
          });
        }
      });
    };

    window.addEventListener('scroll', trackScroll, { passive: true });

    // Time on page — fire at 30s, 60s, 2min, 5min
    [30, 60, 120, 300].forEach((seconds) => {
      setTimeout(() => {
        if (document.visibilityState === 'hidden') return;
        window.gtag?.('event', 'time_on_page', {
          event_category: 'engagement',
          event_label: `${seconds}s`,
          value: seconds,
          page_path: window.location.pathname,
        });
      }, seconds * 1000);
    });
  };

  const loadClarity = () => {
    if (window.clarity) return;
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, 'clarity', 'script', 'wu351o84oe');
  };

  const loadAnalytics = () => {
    // gtag.js is loaded statically in <head> — just grant consent and init tracking
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });

    loadClarity();
    initAnalyticsTracking();
  };

  const applyConsent = (consent) => {
    if (consent === 'accepted') {
      loadAnalytics();
      banner.hidden = true;
      if (reopenButton) reopenButton.hidden = false;
      return;
    }

    if (consent === 'declined') {
      banner.hidden = true;
      if (reopenButton) reopenButton.hidden = false;
      return;
    }

    banner.hidden = false;
    if (reopenButton) reopenButton.hidden = true;
  };


  const storedConsent = window.localStorage.getItem(storageKey);
  if (storedConsent) {
    applyConsent(storedConsent);
  } else {
    applyConsent(null);
  }

  acceptButton?.addEventListener('click', () => {
    window.localStorage.setItem(storageKey, 'accepted');
    applyConsent('accepted');
  });

  declineButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.localStorage.setItem(storageKey, 'declined');
      applyConsent('declined');
    });
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

  const locale = getLocale();
  const messages = locale === 'en'
    ? {
        sending: 'Sending...',
        success: 'Thank you. Your request was sent successfully.',
        error: 'Sending failed. Please try again or contact us by email.',
      }
    : {
        sending: 'Wird gesendet...',
        success: 'Danke. Die Anfrage wurde erfolgreich gesendet.',
        error: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder schreiben Sie per E-Mail.',
      };

  const webhookUrl = 'https://hook.eu2.make.com/y5jbf5tppgs3e9gfiyuwtol7bx9nxnr6';
  const analysisWebhookUrl = 'https://hook.eu2.make.com/voi2ztpfhfwloym9exphw29rmn2dju3f';
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
      payload.timestamp = new Date().toISOString();
      payload.angemeldet = 'ja';

      const target = (form.dataset.formSource || '').startsWith('3-tipps')
        ? analysisWebhookUrl
        : webhookUrl;

      status.textContent = messages.sending;
      status.dataset.state = 'loading';
      status.hidden = false;
      submitButton?.setAttribute('disabled', 'disabled');
      if (submitButton) submitButton.textContent = messages.sending;

      try {
        const response = await fetch(target, {
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
        status.textContent = messages.success;
        status.dataset.state = 'success';
        status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch (error) {
        status.textContent = messages.error;
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

const initSeoSwitcher = () => {
  const switcher = document.querySelector('[data-seo-switcher]');
  if (!switcher) return;

  const tabs = [...switcher.querySelectorAll('[data-seo-tab]')];
  const panels = [...switcher.querySelectorAll('[data-seo-panel]')];

  const setActive = (target) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.seoTab === target;
      tab.classList.toggle('seo-ba-tab--active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const active = panel.dataset.seoPanel === target;
      panel.hidden = !active;
      panel.classList.toggle('seo-panel--active', active);
    });

    switcher.classList.toggle('is-after', target === 'after');
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActive(tab.dataset.seoTab));
  });
};

const initCompareBlocks = (root = document) => {
  const compareBlocks = root.querySelectorAll('[data-compare]');
  compareBlocks.forEach((block) => {
    const range = block.querySelector('.compare-range');
    const base = block.querySelector('.compare-base');
    const overlay = block.querySelector('.compare-overlay');
    const baseMedia = base?.querySelector('img, video');
    const overlayMedia = overlay?.querySelector('img, video');
    const handle = block.querySelector('.compare-handle');
    const line = block.querySelector('.compare-line');
    if (!range || block.dataset.compareReady === 'true') return;

    block.dataset.compareReady = 'true';

    const update = () => block.style.setProperty('--pos', `${range.value}%`);
    range.addEventListener('input', update, { passive: true });
    update();

    const updateRatio = () => {
      if (!baseMedia || !overlayMedia) return;
      const baseW = baseMedia.tagName === 'VIDEO' ? baseMedia.videoWidth : baseMedia.naturalWidth;
      const baseH = baseMedia.tagName === 'VIDEO' ? baseMedia.videoHeight : baseMedia.naturalHeight;
      const overW = overlayMedia.tagName === 'VIDEO' ? overlayMedia.videoWidth : overlayMedia.naturalWidth;
      const overH = overlayMedia.tagName === 'VIDEO' ? overlayMedia.videoHeight : overlayMedia.naturalHeight;
      if (!baseW || !baseH || !overW || !overH) return;
      const targetRatio = Math.min(baseW / baseH, overW / overH);
      block.style.setProperty('--compare-ratio', `${targetRatio}`);
    };

    if (baseMedia?.tagName === 'VIDEO') {
      baseMedia.addEventListener('loadedmetadata', updateRatio, { once: true });
    } else {
      baseMedia?.addEventListener('load', updateRatio, { once: true });
    }
    if (overlayMedia?.tagName === 'VIDEO') {
      overlayMedia.addEventListener('loadedmetadata', updateRatio, { once: true });
    } else {
      overlayMedia?.addEventListener('load', updateRatio, { once: true });
    }
    updateRatio();

    const setPosFromClientX = (clientX) => {
      const rect = block.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(0, Math.min(100, pct));
      range.value = clamped.toFixed(2);
      update();
    };

    block.addEventListener('click', (event) => {
      if (event.target.closest('.compare-range')) return;
      setPosFromClientX(event.clientX);
    });

    [handle, line].filter(Boolean).forEach((target) => {
      let dragging = false;
      target.addEventListener('pointerdown', (event) => {
        dragging = true;
        target.setPointerCapture(event.pointerId);
        setPosFromClientX(event.clientX);
      });
      target.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        setPosFromClientX(event.clientX);
      });
      const endDrag = () => {
        dragging = false;
      };
      target.addEventListener('pointerup', endDrag);
      target.addEventListener('pointercancel', endDrag);
    });
  });
};

const initProcessTimeline = () => {
  const processTimeline = document.querySelector('[data-process-timeline]');
  if (!processTimeline || processTimeline.dataset.timelineReady === 'true') return;

  processTimeline.dataset.timelineReady = 'true';
  const steps = Array.from(processTimeline.querySelectorAll('[data-step]'));

  const updateTimeline = () => {
    const rect = processTimeline.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const start = viewportHeight * 0.72;
    const progress = Math.max(0, Math.min(start - rect.top, rect.height));
    const percent = rect.height ? (progress / rect.height) * 100 : 0;
    processTimeline.style.setProperty('--process-progress', `${percent}%`);

    const activateLine = viewportHeight * 0.66;
    steps.forEach((step) => {
      const stepRect = step.getBoundingClientRect();
      step.classList.toggle('is-active', stepRect.top <= activateLine);
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateTimeline();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateTimeline, { passive: true });
  updateTimeline();
};

const initCaseCarousel = () => {
  const caseCarousel = document.querySelector('[data-case-carousel]');
  if (!caseCarousel || caseCarousel.dataset.carouselReady === 'true') return;

  caseCarousel.dataset.carouselReady = 'true';
  const slides = Array.from(caseCarousel.querySelectorAll('.case-carousel-slide'));
  const prevButton = caseCarousel.querySelector('.case-carousel-prev');
  const nextButton = caseCarousel.querySelector('.case-carousel-next');
  let slots = [slides.length - 1, 0, 1, 2];

  const renderCaseCarousel = () => {
    const [leftIndex, activeIndex, rightIndex, hiddenIndex] = slots;

    slides.forEach((slide, index) => {
      slide.classList.remove('is-prev', 'is-active', 'is-next', 'is-off-center');

      if (index === activeIndex) {
        slide.classList.add('is-active');
        return;
      }
      if (index === leftIndex) {
        slide.classList.add('is-prev');
        return;
      }
      if (index === rightIndex) {
        slide.classList.add('is-next');
        return;
      }
      if (index === hiddenIndex) {
        slide.classList.add('is-off-center');
      }
    });
  };

  const moveCaseCarousel = (nextDirection) => {
    slots = nextDirection > 0
      ? [slots[1], slots[2], slots[3], slots[0]]
      : [slots[3], slots[0], slots[1], slots[2]];
    renderCaseCarousel();
  };

  prevButton?.addEventListener('click', () => {
    moveCaseCarousel(-1);
  });
  nextButton?.addEventListener('click', () => {
    moveCaseCarousel(1);
  });

  renderCaseCarousel();
};

const initFerrisWheel = () => {
  const wrap = document.querySelector('[data-ferris-wheel]');
  if (!wrap || wrap.dataset.fwReady === 'true') return;

  const svg = wrap.querySelector('.fw-svg');
  const listItems = Array.from(wrap.querySelectorAll('.fw-data > li'));
  const popout = wrap.querySelector('.fw-popout');
  const popoutTitle = wrap.querySelector('.fw-popout-title');
  const popoutText = wrap.querySelector('.fw-popout-text');
  if (!svg || !listItems.length || !popout || !popoutTitle || !popoutText) return;

  wrap.dataset.fwReady = 'true';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svgWidth = 470;
  const svgHeight = 430;
  const cx = 235;
  const cy = 196;
  const rOuter = 162;
  const rInner = 64;
  const rGondola = rOuter + 26;
  const rLabel = (rOuter + rInner) / 2 + 4;
  const count = listItems.length;
  const segAngle = 360 / count;
  const startOffset = -90;

  const toXY = (r, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const ringPath = (r1, r2, start, end) => {
    const p1 = toXY(r1, start);
    const p2 = toXY(r2, start);
    const p3 = toXY(r2, end);
    const p4 = toXY(r1, end);
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${r2} ${r2} 0 0 1 ${p3.x} ${p3.y} L ${p4.x} ${p4.y} A ${r1} ${r1} 0 0 0 ${p1.x} ${p1.y} Z`;
  };
  const wedgePath = (start, end) => ringPath(rInner, rOuter, start, end);

  const stand = document.createElementNS(svgNS, 'g');
  stand.setAttribute('class', 'fw-stand');
  stand.setAttribute('aria-hidden', 'true');
  const standBottom = cy + rOuter + 55;
  [-1, 1].forEach((side) => {
    const leg = document.createElementNS(svgNS, 'line');
    leg.setAttribute('x1', cx + side * 26);
    leg.setAttribute('y1', cy + rInner - 6);
    leg.setAttribute('x2', cx + side * 88);
    leg.setAttribute('y2', standBottom);
    stand.appendChild(leg);
  });
  const ground = document.createElementNS(svgNS, 'line');
  ground.setAttribute('x1', cx - 118);
  ground.setAttribute('y1', standBottom);
  ground.setAttribute('x2', cx + 118);
  ground.setAttribute('y2', standBottom);
  stand.appendChild(ground);
  svg.appendChild(stand);

  const segments = [];
  const midAngles = [];
  const angleRanges = [];

  listItems.forEach((li, i) => {
    const start = startOffset + i * segAngle;
    const end = start + segAngle;
    const mid = start + segAngle / 2;
    midAngles.push(mid);
    angleRanges.push({ start, end });

    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'fw-segment');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', li.dataset.fwTitle || li.dataset.fwLabel || '');

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', wedgePath(start, end));
    path.setAttribute('class', 'fw-wedge');
    g.appendChild(path);

    const spokeEnd = toXY(rGondola - 14, mid);
    const spoke = document.createElementNS(svgNS, 'line');
    spoke.setAttribute('x1', String(cx));
    spoke.setAttribute('y1', String(cy));
    spoke.setAttribute('x2', String(spokeEnd.x));
    spoke.setAttribute('y2', String(spokeEnd.y));
    spoke.setAttribute('class', 'fw-spoke');
    g.appendChild(spoke);

    const gondolaPos = toXY(rGondola, mid);
    const gondola = document.createElementNS(svgNS, 'circle');
    gondola.setAttribute('cx', String(gondolaPos.x));
    gondola.setAttribute('cy', String(gondolaPos.y));
    gondola.setAttribute('r', '14');
    gondola.setAttribute('class', 'fw-gondola');
    g.appendChild(gondola);

    const gondolaNum = document.createElementNS(svgNS, 'text');
    gondolaNum.setAttribute('x', String(gondolaPos.x));
    gondolaNum.setAttribute('y', String(gondolaPos.y));
    gondolaNum.setAttribute('class', 'fw-gondola-num');
    gondolaNum.setAttribute('text-anchor', 'middle');
    gondolaNum.setAttribute('dominant-baseline', 'central');
    gondolaNum.textContent = String(i + 1);
    g.appendChild(gondolaNum);

    const labelPos = toXY(rLabel, mid);
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(labelPos.x));
    label.setAttribute('y', String(labelPos.y));
    label.setAttribute('class', 'fw-label');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.textContent = (li.dataset.fwLabel || '').toUpperCase();
    g.appendChild(label);

    svg.appendChild(g);
    segments.push(g);

    const activate = () => setActive(i);
    g.addEventListener('pointerenter', activate);
    g.addEventListener('focus', activate);
    g.addEventListener('click', activate);
    g.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });

  const hub = document.createElementNS(svgNS, 'circle');
  hub.setAttribute('cx', String(cx));
  hub.setAttribute('cy', String(cy));
  hub.setAttribute('r', String(rInner));
  hub.setAttribute('class', 'fw-hub');
  svg.appendChild(hub);

  const hubHit = document.createElementNS(svgNS, 'circle');
  hubHit.setAttribute('cx', String(cx));
  hubHit.setAttribute('cy', String(cy));
  hubHit.setAttribute('r', String(rInner + 6));
  hubHit.setAttribute('class', 'fw-hub-hit');
  hubHit.setAttribute('aria-hidden', 'true');
  svg.appendChild(hubHit);

  const hubArc = document.createElementNS(svgNS, 'path');
  hubArc.setAttribute('class', 'fw-hub-arc');
  svg.appendChild(hubArc);

  const hubNum = document.createElementNS(svgNS, 'text');
  hubNum.setAttribute('x', String(cx));
  hubNum.setAttribute('y', String(cy - 10));
  hubNum.setAttribute('class', 'fw-hub-num');
  hubNum.setAttribute('text-anchor', 'middle');
  svg.appendChild(hubNum);

  const hubLabel = document.createElementNS(svgNS, 'text');
  hubLabel.setAttribute('x', String(cx));
  hubLabel.setAttribute('y', String(cy + 16));
  hubLabel.setAttribute('class', 'fw-hub-label');
  hubLabel.setAttribute('text-anchor', 'middle');
  svg.appendChild(hubLabel);

  let activeIndex = -1;
  let autoAdvanceTimer = null;
  let startDelayTimer = null;
  let isInView = false;
  const restartDelay = 1500;

  function clearActive() {
    segments.forEach((seg) => seg.classList.remove('is-active'));
    activeIndex = -1;
    hubNum.textContent = '5';
    hubLabel.textContent = 'DINGE';
    hubArc.setAttribute('d', '');
    popoutTitle.textContent = '';
    popoutText.textContent = '';
    popout.classList.remove('is-visible');
  }

  function setActive(i) {
    activeIndex = i;
    segments.forEach((seg, idx) => seg.classList.toggle('is-active', idx === i));
    const li = listItems[i];
    hubNum.textContent = String(i + 1).padStart(2, '0');
    hubLabel.textContent = (li.dataset.fwLabel || '').toUpperCase();
    const { start, end } = angleRanges[i];
    hubArc.setAttribute('d', ringPath(rInner, rInner + 10, start, end));

    const angle = midAngles[i];
    const rad = (angle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const dampX = 0.3;
    const dampY = 0.28;
    const anchor = toXY(rOuter - 12, angle);
    popout.style.left = `${(anchor.x / svgWidth) * 100}%`;
    popout.style.top = `${(anchor.y / svgHeight) * 100}%`;
    popout.style.setProperty('--tx', `${-50 + 50 * dampX * cosA}%`);
    popout.style.setProperty('--ty', `${-50 + 50 * dampY * sinA}%`);
    popoutTitle.textContent = li.dataset.fwTitle || li.dataset.fwLabel || '';
    popoutText.textContent = li.dataset.fwPoints || li.textContent.trim();
    popout.classList.add('is-visible');
  }

  const stopAutoAdvance = () => {
    if (startDelayTimer) {
      window.clearTimeout(startDelayTimer);
      startDelayTimer = null;
    }
    if (autoAdvanceTimer) {
      window.clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  };

  const scheduleSequenceStep = (index, delay) => {
    autoAdvanceTimer = window.setTimeout(() => {
      if (!isInView) return;

      setActive(index);

      if (index === count - 1) {
        startDelayTimer = window.setTimeout(() => {
          if (!isInView) return;
          clearActive();
          startAutoAdvance(true, restartDelay);
        }, 2500);
        return;
      }

      scheduleSequenceStep(index + 1, 2500);
    }, delay);
  };

  const startAutoAdvance = (reset = false, delay = 0) => {
    stopAutoAdvance();
    if (reset) clearActive();

    startDelayTimer = window.setTimeout(() => {
      if (!isInView) return;
      scheduleSequenceStep(0, 0);
    }, delay);
  };

  clearActive();
  wrap.classList.add('fw--ready');

  hubHit.addEventListener('pointerenter', () => {
    stopAutoAdvance();
    clearActive();
    if (isInView) startAutoAdvance(true, restartDelay);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== wrap) return;

          if (entry.isIntersecting) {
            isInView = true;
            startAutoAdvance(true, 0);
          } else {
            isInView = false;
            stopAutoAdvance();
            clearActive();
          }
        });
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(wrap);
  } else {
    startAutoAdvance(true);
  }
};

const initDeferredInteractions = () => {
  const boot = () => {
    initCompareBlocks();
    initProcessTimeline();
    initCaseCarousel();
    initFerrisWheel();
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(boot, { timeout: 1200 });
  } else {
    window.setTimeout(boot, 250);
  }
};

const initAboutVideo = () => {
  const card = document.querySelector('[data-about-video]');
  if (!card) return;

  const video = card.querySelector('video');
  const playButton = card.querySelector('[data-about-video-play]');
  if (!video || !playButton) return;

  const updateVideoUi = () => {
    card.dataset.videoState = video.paused ? 'paused' : video.muted ? 'muted' : 'playing';
  };

  const startWithSound = async (restart = false) => {
    if (restart) video.currentTime = 0;
    video.muted = false;
    video.loop = false;
    video.controls = true;
    try {
      await video.play();
    } catch (error) {
      video.muted = true;
    }
    updateVideoUi();
  };

  playButton.addEventListener('click', () => {
    startWithSound(true);
  });

  video.addEventListener('pause', updateVideoUi);
  video.addEventListener('play', updateVideoUi);
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    video.muted = true;
    video.controls = false;
    video.loop = true;
    video.play().catch(() => {});
    updateVideoUi();
  });

  updateVideoUi();
};

initMenu();
initLanguageSwitch();
initCookieBanner();
initLeadForms();
initSeoSwitcher();
initDeferredInteractions();
initAboutVideo();

// Scroll animations
const initScrollAnimations = () => {
  const targets = document.querySelectorAll(
    '.service-card, .diff-card, .option-card, .compare-card, .seo-step, .ads-card, .faq-item, .home-problem-lead, .home-problem-sub, .home-problem-question, .diff-with-image, .section-question, .lc-faq-item, .lc-who-card, .lc-tips-card, .lc-reveal'
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el, i) => {
    // stagger cards in a grid
    const parent = el.parentElement;
    const siblings = [...parent.children].filter(c => c.classList.contains(el.classList[0]));
    const idx = siblings.indexOf(el);
    el.style.transitionDelay = `${idx * 80}ms`;
    observer.observe(el);
  });
};

initScrollAnimations();

// LC newsletter subscribe form
const initSubscribeForm = () => {
  const form = document.querySelector('.lc-subscribe-form');
  if (!form) return;

  const webhookUrl = 'https://hook.eu2.make.com/py853sy75xwacg5chb32gtk0i3cyt48a';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalLabel = btn?.textContent;
    if (btn) btn.disabled = true;

    const payload = {
      email: form.querySelector('input[name="email"]')?.value,
      source: form.dataset.formSource || 'newsletter',
      page: window.location.pathname,
      angemeldet: 'ja',
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (_) {}

    // Show confirmation regardless of network result
    const thanks = document.getElementById('lc-thanks');
    if (thanks) {
      // Hide all other main sections
      document.querySelectorAll('main > section, main > div').forEach(el => {
        if (el !== thanks) el.hidden = true;
      });
      thanks.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (btn) { btn.disabled = false; if (originalLabel) btn.textContent = originalLabel; }
  });
};
initSubscribeForm();

// LC location pill
const initLocationPill = () => {
  const pill = document.getElementById('lc-location');
  if (!pill) return;
  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(data => {
      if (data.city) {
        pill.textContent = `${data.city}, ${data.country_name}`;
      }
    })
    .catch(() => {});
};
initLocationPill();

// LC header shrink on scroll
const lcHeader = document.querySelector('.lc-header');
if (lcHeader) {
  const onLcScroll = () => {
    lcHeader.classList.toggle('lc-header--scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onLcScroll, { passive: true });
  onLcScroll();
}
