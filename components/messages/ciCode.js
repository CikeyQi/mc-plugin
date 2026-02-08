const CICODE_PATTERN = /\[\[CICode,.*?url=([^,\]]+).*?\]\]/i;
const CICODE_BLOCK_PATTERN = /\[\[CICode,.*?\]\]/i;

export function extractCICodeImage(text) {
  if (typeof text !== 'string') {
    return { text: String(text ?? ''), imageUrl: null };
  }

  const match = text.match(CICODE_PATTERN);
  if (!match) {
    return { text, imageUrl: null };
  }

  return {
    text: text.replace(CICODE_BLOCK_PATTERN, '').trim(),
    imageUrl: match[1]
  };
}
