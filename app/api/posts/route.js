import { NextResponse } from "next/server";
import { checkApp } from "@/lib/auth";
import { getPosts, savePosts, kvConfigured } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!checkApp(request)) return NextResponse.json({ connected: false }, { status: 401 });
  if (!kvConfigured()) return NextResponse.json({ posts: [], warning: "KV not configured" });
  const posts = await getPosts();
  posts.sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));
  return NextResponse.json({ posts });
}

export async function DELETE(request) {
  if (!checkApp(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const posts = await getPosts();
  await savePosts(posts.filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}
