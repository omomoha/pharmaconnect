import { sanitizeHtml, escapeHtml } from '@/lib/utils/sanitize';

describe('sanitizeHtml', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should return empty string for null/undefined', () => {
    expect(sanitizeHtml(null as unknown as string)).toBe('');
    expect(sanitizeHtml(undefined as unknown as string)).toBe('');
  });

  it('should strip HTML tags', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
    expect(sanitizeHtml('<b>bold</b>')).toBe('bold');
    expect(sanitizeHtml('<img src="x" onerror="alert(1)"/>')).toBe('');
  });

  it('should strip nested tags', () => {
    expect(sanitizeHtml('<div><p>Hello <b>world</b></p></div>')).toBe('Hello world');
  });

  it('should decode HTML entities', () => {
    expect(sanitizeHtml('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
  });

  it('should preserve normal text', () => {
    expect(sanitizeHtml('Just a normal message with no HTML')).toBe('Just a normal message with no HTML');
  });

  it('should handle mixed content', () => {
    expect(sanitizeHtml('Hello <b>world</b> &amp; goodbye')).toBe('Hello world & goodbye');
  });

  it('should strip event handler attributes in tags', () => {
    const input = '<a href="javascript:alert(1)" onclick="evil()">Click</a>';
    expect(sanitizeHtml(input)).toBe('Click');
  });
});

describe('escapeHtml', () => {
  it('should return empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should escape special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('"quotes"')).toBe('&quot;quotes&quot;');
    expect(escapeHtml("it's")).toBe("it&#39;s");
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should not double-escape', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });

  it('should preserve normal text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});
