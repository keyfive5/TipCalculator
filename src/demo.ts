import { Platform } from 'react-native';

/**
 * Web-only demo state for rendering App Store screenshots, e.g.
 *   http://localhost:8081/?demo={"people":3}&bill=84.21&ruler=1
 * Native builds never read this.
 */
export function demoParams(): URLSearchParams | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) return null;
  const p = new URLSearchParams(window.location.search);
  return p.has('demo') ? p : null;
}

export function demoSettings(): Record<string, unknown> | null {
  const p = demoParams();
  if (!p) return null;
  try {
    return JSON.parse(p.get('demo') || '{}');
  } catch {
    return {};
  }
}
