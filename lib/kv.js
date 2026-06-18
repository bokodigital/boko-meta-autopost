// Vercel KV / Upstash Redis via REST.
const URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
const POSTS_KEY = "boko:meta:posts";

export function kvConfigured() { return Boolean(URL && TOKEN); }

async function cmd(args) {
  if (!kvConfigured()) throw new Error("KV not configured (KV_REST_API_URL / KV_REST_API_TOKEN).");
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const j = await res.json();
  if (!res.ok || (j && j.error)) throw new Error((j && j.error) || `KV error ${res.status}`);
  return j.result;
}

export async function getPosts() {
  const r = await cmd(["GET", POSTS_KEY]);
  if (!r) return [];
  try { return JSON.parse(r); } catch (e) { return []; }
}
export async function savePosts(arr) {
  await cmd(["SET", POSTS_KEY, JSON.stringify(arr)]);
}
