import { safeJsonParse } from '../utils/safeJson.js';

function extractTextFromComponent(node) {
  if (node === null || node === undefined) return '';

  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextFromComponent).join('');
  }

  if (typeof node === 'object') {
    let text = '';
    if (typeof node.text === 'string') text += node.text;
    else if (typeof node.translate === 'string') text += node.translate;
    else if (typeof node.key === 'string') text += node.key;

    if (Array.isArray(node.extra)) {
      text += node.extra.map(extractTextFromComponent).join('');
    }

    if (Array.isArray(node.with)) {
      text += node.with.map(extractTextFromComponent).join('');
    }

    return text;
  }

  return '';
}

export function getPlainTextFromRawMessage(raw) {
  if (raw === null || raw === undefined) return '';

  if (typeof raw !== 'string') {
    return extractTextFromComponent(raw);
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = safeJsonParse(trimmed);
    if (parsed.ok) {
      const text = extractTextFromComponent(parsed.value);
      return text || raw;
    }
  }

  return raw;
}
