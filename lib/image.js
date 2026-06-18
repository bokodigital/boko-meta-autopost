import { put } from "@vercel/blob";

export async function generateImage({ title, keyword, context }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set.");
  const prompt =
    `High-quality, professional marketing image for a social media post about "${title}". ` +
    (keyword ? `Theme/keywords: ${keyword}. ` : "") +
    (context ? `Context: ${String(context).slice(0, 300)}. ` : "") +
    `Clean, modern, vibrant, no text or logos in the image.`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || "1024x1024",
      n: 1,
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error((j.error && j.error.message) || `Image generation failed (${res.status})`);
  const b64 = j.data && j.data[0] && j.data[0].b64_json;
  if (!b64) throw new Error("No image returned by the image API.");
  const buf = Buffer.from(b64, "base64");
  const name = `boko-meta/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const { url } = await put(name, buf, { access: "public", contentType: "image/png" });
  return url;
}
