export function safeRegExp(pattern, flags) {
  if (typeof pattern !== 'string' || pattern.length === 0) return null;
  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    return null;
  }
}
