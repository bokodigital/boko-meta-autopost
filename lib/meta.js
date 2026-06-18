const V = process.env.META_API_VERSION || "v21.0";
const G = `https://graph.facebook.com/${V}`;

export function metaStatus() {
  const token = !!process.env.FB_PAGE_ACCESS_TOKEN;
  return {
    facebook: !!(process.env.FB_PAGE_ID && token),
    instagram: !!(process.env.IG_USER_ID && token),
  };
}

export async function postToFacebook({ caption, imageUrl }) {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) throw new Error("Facebook not configured.");
  const params = new URLSearchParams({ url: imageUrl, caption: caption || "", access_token: token });
  const res = await fetch(`${G}/${pageId}/photos`, { method: "POST", body: params });
  const j = await res.json();
  if (!res.ok || j.error) throw new Error("Facebook: " + ((j.error && j.error.message) || res.status));
  return j.post_id || j.id;
}

export async function postToInstagram({ caption, imageUrl }) {
  const igId = process.env.IG_USER_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!igId || !token) throw new Error("Instagram not configured.");
  const c = new URLSearchParams({ image_url: imageUrl, caption: caption || "", access_token: token });
  const cr = await fetch(`${G}/${igId}/media`, { method: "POST", body: c });
  const cj = await cr.json();
  if (!cr.ok || cj.error || !cj.id) throw new Error("Instagram (container): " + ((cj.error && cj.error.message) || cr.status));
  const p = new URLSearchParams({ creation_id: cj.id, access_token: token });
  const pr = await fetch(`${G}/${igId}/media_publish`, { method: "POST", body: p });
  const pj = await pr.json();
  if (!pr.ok || pj.error) throw new Error("Instagram (publish): " + ((pj.error && pj.error.message) || pr.status));
  return pj.id;
}
