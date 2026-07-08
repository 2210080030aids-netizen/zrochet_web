export function formatInstagramLabel(url: string): string {
  const match = url.trim().match(/instagram\.com\/([^/?#]+)/i);
  return match?.[1] ? `@${match[1]}` : "Instagram";
}

export function normalizeInstagramUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const handle = trimmed.replace(/^@/, "");
  return `https://www.instagram.com/${handle}`;
}
