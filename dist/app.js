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

const initCookieBanner = () => {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;

  const storageKey = 'webservice_cookie_consent';
  const acceptButton = banner.querySelector('[data-cookie-accept]');
  const declineButton = banner.querySelector('[data-cookie-decline]');
  const manageButtons = document.querySelectorAll('[data-cookie-open]');
  const GA_MEASUREMENT_ID = 'G-JWEQYND20F';

  const initAnalyticsTracking = () => {
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

  const loadAnalytics = () => {
    if (!GA_MEASUREMENT_ID || window.gtag) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    // Consent Mode v2 — grant analytics, keep ads denied
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: true,
    });

    initAnalyticsTracking();
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

      status.textContent = messages.sending;
      status.dataset.state = 'loading';
      status.hidden = false;
      submitButton?.setAttribute('disabled', 'disabled');
      if (submitButton) submitButton.textContent = messages.sending;

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
      tab.classList.toggle('seo-tab--active', active);
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

const initDeferredInteractions = () => {
  const boot = () => {
    initCompareBlocks();
    initProcessTimeline();
    initCaseCarousel();
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
    '.service-card, .diff-card, .option-card, .compare-card, .seo-step, .ads-card, .faq-item, .home-problem-lead, .home-problem-sub, .home-problem-question, .diff-with-image, .section-question'
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
