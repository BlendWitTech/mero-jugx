import { sanitizeHtml, sanitizeObject, escapeHtml, sanitizeEmail, sanitizeUrl } from './sanitize.util';

describe('Sanitize Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove all HTML tags', () => {
      const dirty = '<script>alert("xss")</script>Hello';
      const result = sanitizeHtml(dirty);
      expect(result).toBe('Hello');
    });

    it('should handle empty string', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle plain text', () => {
      const result = sanitizeHtml('Plain text');
      expect(result).toBe('Plain text');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values', () => {
      const obj = {
        name: '<script>alert("xss")</script>Test',
        age: 25,
      };
      const result = sanitizeObject(obj);
      expect(result.name).toBe('Test');
      expect(result.age).toBe(25);
    });

    it('should sanitize nested objects', () => {
      const obj = {
        user: {
          name: '<script>alert("xss")</script>User',
          email: 'test@example.com',
        },
      };
      const result = sanitizeObject(obj);
      expect(result.user.name).toBe('User');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should sanitize arrays', () => {
      const obj = {
        tags: ['<script>alert("xss")</script>Tag1', 'Tag2'],
      };
      const result = sanitizeObject(obj);
      expect(result.tags[0]).toBe('Tag1');
      expect(result.tags[1]).toBe('Tag2');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const text = '<div>Hello & "World"</div>';
      const result = escapeHtml(text);
      expect(result).toBe('&lt;div&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });

    it('should handle already clean email', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    });
  });

  describe('sanitizeUrl', () => {
    it('should validate and return valid HTTP URL', () => {
      const url = 'http://example.com';
      const result = sanitizeUrl(url);
      expect(result).toBe('http://example.com/');
    });

    it('should validate and return valid HTTPS URL', () => {
      const url = 'https://example.com';
      const result = sanitizeUrl(url);
      expect(result).toBe('https://example.com/');
    });

    it('should return empty string for invalid protocol', () => {
      const url = 'javascript:alert("xss")';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });

    it('should return empty string for invalid URL', () => {
      const url = 'not-a-url';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });
  });
});

