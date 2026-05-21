export interface ParsedDeepLink {
  screen: 'ItemDetail';
  itemId: string;
}

/**
 * Parses a tectsoft-rn deep link URL.
 * Returns a ParsedDeepLink when the URL is a valid item link, null otherwise.
 *
 * Valid format: tectsoft-rn://item/<non-empty-id>
 */
export function parseDeepLink(url: string): ParsedDeepLink | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'tectsoft-rn:') {
    return null;
  }

  if (parsed.hostname !== 'item') {
    return null;
  }

  // pathname is "/<id>" — strip leading slash and decode percent-encoding
  const itemId = decodeURIComponent(parsed.pathname.replace(/^\//, '')).trim();
  if (!itemId) {
    return null;
  }

  return { screen: 'ItemDetail', itemId };
}
