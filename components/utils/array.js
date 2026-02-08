export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function toStringArray(value) {
  return asArray(value).map((item) => String(item));
}
