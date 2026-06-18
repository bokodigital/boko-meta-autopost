import { NextResponse } from "next/server";
import { checkApp } from "@/lib/auth";
import { getPosts, savePosts, kvConfigured } from "@/lib/kv";

export const dynamic = "force-dynamic";

// POST { plan:[ post... ] } -> append to the stored queue.
export async function POST(request) {
  if (!checkApp(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!kvConfigured()) return NextResponse.json({ error: "Storage (KV) not configured." }, { status: 500 });
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }
  const plan = (body.plan || []).map((p) => ({
    ...p,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  }));
  if (!plan.length) return NextResponse.json({ error: "Nothing to schedule." }, { status: 400 });
  const existing = await getPosts();
  const merged = existing.concat(plan);
  await savePosts(merged);
  return NextResponse.json({ ok: true, added: plan.length, total: merged.length });
}
