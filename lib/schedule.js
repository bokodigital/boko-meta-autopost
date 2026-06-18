// Spread `count` posts roughly evenly across the next ~30 days at 09:00 local-ish.
export function spreadDates(count, start) {
  const out = [];
  const n = Math.max(0, parseInt(count, 10) || 0);
  if (!n) return out;
  const days = 30;
  const step = days / n;
  const base = start ? new Date(start) : new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + Math.round(step * i) + 1);
    d.setHours(9, 0, 0, 0);
    out.push(d.toISOString());
  }
  return out;
}
