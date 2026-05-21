import DOMPurify from 'dompurify';

const QUILL_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'blockquote', 'pre', 'code', 'a', 'span', 'div',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  ALLOWED_URI_REGEXP: /^(https?|mailto):/i,
};

export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, QUILL_CONFIG);
}
