const siteOrigin = 'https://impress-rank.de';

// Keep the public URL convention in one place: short page URLs and directory blogs.
export const cleanInternalUrl = (value) => {
  if (!value || /^(?:mailto:|tel:|#|data:|javascript:)/i.test(value)) return value;
  if (/^(?:https?:)?\/\//i.test(value)) {
    const url = new URL(value, siteOrigin);
    if (url.origin !== siteOrigin) return value;
    url.pathname = cleanPath(url.pathname);
    return value.startsWith('//') ? `//${url.host}${url.pathname}${url.search}${url.hash}` : url.href;
  }
  const [, path, suffix = ''] = value.match(/^([^?#]*)([\s\S]*)$/);
  return cleanPath(path) + suffix;
};

const cleanPath = (path) => path
  .replace(/(^|\/)index\.html$/, '$1')
  .replace(/\.html$/, '') || './';

export const normalizeHtmlUrls = (html) => html
  .replace(/(\bhref\s*=\s*)(["'])(.*?)\2/gi,
    (_, prefix, quote, value) => `${prefix}${quote}${cleanInternalUrl(value)}${quote}`)
  // Includes Open Graph and JSON-LD URLs as well as canonical links.
  .replace(/https:\/\/impress-rank\.de\/[^\s"'<>\\]*/g, cleanInternalUrl);

export const isNoindexHtml = (html) => (html.match(/<meta\b[^>]*>/gi) || []).some((tag) =>
  /\bname\s*=\s*["'](?:robots|googlebot)["']/i.test(tag)
  && /\bcontent\s*=\s*["'][^"']*\bnoindex\b/i.test(tag));
