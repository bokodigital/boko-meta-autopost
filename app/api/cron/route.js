import { NextResponse } from "next/server";
import { checkCron } from "@/lib/auth";
import { getPosts, savePosts, kvConfigured } from "@/lib/kv";
import { generateImage } from "@/lib/image";
import { postToFacebook, postToInstagram } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Runs on a schedule (Vercel Cron). Publishes any due posts.
export async function GET(request) {
  if (!checkCron(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!kvConfigured()) return NextResponse.json({ error: "KV not configured" }, { status: 500 });

  const posts = await getPosts();
  const now = Date.now();
  let published = 0, failed = 0;

  for (const p of posts) {
    if (p.status !== "scheduled") continue;
    if (new Date(p.scheduledAt).getTime() > now) continue;
    try {
      const imageUrl = await generateImage({ title: p.title, keyword: p.keyword, context: p.context });
      p.imageUrl = imageUrl;
      p.results = {};
      const platforms = p.platforms || ["facebook"];
      if (platforms.includes("facebook")) p.results.facebook = await postToFacebook({ caption: p.caption, imageUrl });
      if (platforms.includes("instagram")) p.results.instagram = await postToInstagram({ caption: p.caption, imageUrl });
      p.status = "published";
      p.publishedAt = new Date().toISOString();
      p.error = "";
      published++;
    } catch (e) {
      p.status = "error";
      p.error = e.message || String(e);
      failed++;
    }
  }
  await savePosts(posts);
  return NextResponse.json({ ok: true, published, failed, checked: posts.length });
}
