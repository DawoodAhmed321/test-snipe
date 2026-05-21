/**
 * Unit tests for the deep link parser.
 *
 * Tests the pure `parseDeepLink` function in isolation — no React Native,
 * no Supabase, no network. Every test exercises our own logic.
 */
import { parseDeepLink } from '../src/lib/deepLink';

describe('parseDeepLink', () => {
  // ── Valid links ──────────────────────────────────────────────────────────

  it('returns screen + itemId for a valid item URL', () => {
    const result = parseDeepLink('tectsoft-rn://item/abc-123');
    expect(result).toEqual({ screen: 'ItemDetail', itemId: 'abc-123' });
  });

  it('handles a UUID-style item id', () => {
    const result = parseDeepLink(
      'tectsoft-rn://item/550e8400-e29b-41d4-a716-446655440000',
    );
    expect(result).toEqual({
      screen: 'ItemDetail',
      itemId: '550e8400-e29b-41d4-a716-446655440000',
    });
  });

  it('handles a numeric item id', () => {
    const result = parseDeepLink('tectsoft-rn://item/42');
    expect(result).toEqual({ screen: 'ItemDetail', itemId: '42' });
  });

  // ── Invalid / edge cases ─────────────────────────────────────────────────

  it('returns null for wrong scheme', () => {
    expect(parseDeepLink('https://example.com/item/abc-123')).toBeNull();
  });

  it('returns null when host is not "item"', () => {
    expect(parseDeepLink('tectsoft-rn://other/abc-123')).toBeNull();
  });

  it('returns null when item id is missing', () => {
    expect(parseDeepLink('tectsoft-rn://item/')).toBeNull();
  });

  it('returns null when item id is only whitespace', () => {
    expect(parseDeepLink('tectsoft-rn://item/%20')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseDeepLink('')).toBeNull();
  });

  it('returns null for a completely invalid URL string', () => {
    expect(parseDeepLink('not a url at all')).toBeNull();
  });

  it('returns null for null input', () => {
    // @ts-expect-error — deliberately testing runtime guard
    expect(parseDeepLink(null)).toBeNull();
  });
});
