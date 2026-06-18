import { NextResponse } from "next/server";
import { checkApp } from "@/lib/auth";
import { buildCaption } from "@/lib/caption";
import { spreadDates } from "@/lib/schedule";

export const dynamic = "force-dynamic";

// POST { topics:[{title,keyword,context}], postsPerMonth, platforms:[...] }
// Returns a preview plan (not saved).
export async function POST(request) {
  if (!checkApp(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const topics = (body.topics || []).filter((t) => (t.title || t.context || t.keyword));
  const count = Math.max(1, parseInt(body.postsPerMonth, 10) || topics.length || 1);
  const platforms = (body.platforms && body.platforms.length ? body.platforms : ["facebook"]);
  if (!topics.length) return NextResponse.json({ error: "Add at least one topic." }, { status: 400 });

  const dates = spreadDates(count);
  const plan = [];
  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    plan.push({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      title: topic.title || "",
      keyword: topic.keyword || "",
      context: topic.context || "",
      caption: buildCaption(topic),
      platforms,
      scheduledAt: dates[i],
      status: "scheduled",
    });
  }
  return NextResponse.json({ plan });
}
