export function appConfigured() { return Boolean(process.env.APP_PASSWORD); }
export function checkApp(request) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return true;
  return request.headers.get("x-app-password") === expected;
}
export function checkCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // if unset, allow (not recommended)
  const auth = request.headers.get("authorization") || "";
  const url = new URL(request.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}
