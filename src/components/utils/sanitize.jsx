import DOMPurify from 'dompurify';

/**
 * Sanitize user input using DOMPurify
 * Prevents XSS attacks by removing dangerous HTML/JS
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // Strip all HTML tags and trim
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim().slice(0, 2000); // Max 2000 chars for any input
}

/**
 * Sanitize HTML content (for rich text display)
 * Allows safe HTML tags but removes scripts
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ADD_ATTR: ['target'],
  });
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false; // RFC 5321
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
}

/**
 * Validate and sanitize numeric input within a range
 */
export function sanitizeNumber(value, min = 0, max = 10, defaultValue = 0) {
  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue;
  return Math.min(max, Math.max(min, num));
}

/**
 * Rate limiter for client-side cooldowns
 */
export function createRateLimiter(cooldownMs = 60000) {
  let lastCall = 0;
  return {
    canCall() {
      return Date.now() - lastCall >= cooldownMs;
    },
    call() {
      lastCall = Date.now();
    },
    remainingMs() {
      const remaining = cooldownMs - (Date.now() - lastCall);
      return remaining > 0 ? remaining : 0;
    },
  };
}
