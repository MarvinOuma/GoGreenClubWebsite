export function webUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password) {
      return url.href;
    }
  } catch {
    return null;
  }
  return null;
}
