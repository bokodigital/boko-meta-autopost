import { NextResponse } from "next/server";
import { metaStatus } from "@/lib/meta";
import { kvConfigured } from "@/lib/kv";
import { appConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = metaStatus();
  return NextResponse.json({
    meta,
    kv: kvConfigured(),
    images: !!process.env.OPENAI_API_KEY,
    passwordRequired: appConfigured(),
  });
}
