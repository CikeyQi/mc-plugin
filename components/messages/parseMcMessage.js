import { safeJsonParse } from '../utils/safeJson.js';

export function parseMcMessage(rawMessage) {
  if (rawMessage && typeof rawMessage === 'object') {
    return { ok: true, value: rawMessage, error: null };
  }

  const parsed = safeJsonParse(rawMessage);
  if (!parsed.ok) {
    return { ok: false, value: null, error: parsed.error };
  }
  return { ok: true, value: parsed.value, error: null };
}
