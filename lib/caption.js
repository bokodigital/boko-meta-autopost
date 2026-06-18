// Rule-based caption builder from title + keyword + context.
export function buildCaption({ title, keyword, context }) {
  const t = (title || "").trim();
  const c = (context || "").trim();
  const k = (keyword || "").trim();

  let cap = t;
  if (c) cap = cap ? `${cap}\n\n${c}` : c;
  if (!cap) cap = k;

  const tags = k
    ? k.split(/[,\s]+/).filter(Boolean).slice(0, 6)
        .map((w) => "#" + w.replace(/[^a-z0-9]/gi, ""))
        .filter((h) => h.length > 1).join(" ")
    : "";

  let out = cap.trim();
  if (out.length > 2000) out = out.slice(0, 2000).trim();
  if (tags) out = `${out}\n\n${tags}`;
  return out.trim();
}
