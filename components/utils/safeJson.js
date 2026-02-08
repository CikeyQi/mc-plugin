export function safeJsonParse(input) {
  if (typeof input !== 'string') {
    return { ok: false, error: new Error('Input is not a string'), value: null };
  }
  try {
    return { ok: true, value: JSON.parse(input), error: null };
  } catch (error) {
    return { ok: false, error, value: null };
  }
}
