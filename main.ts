import { Hono } from "@hono/hono";
import { remarked } from "./remarked.ts";

const encoder = new TextEncoder();
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i]; // XOR ensures timing-safety
  }
  return result === 0;
}

const envApiKey = Deno.env.get("API_KEY") ?? "";

const app = new Hono().post("/", async (c) => {
  const apiKey = c.req.header("x-api-key") ?? "";
  if (!safeCompare(apiKey, envApiKey)) return c.json(void 0, 401);
  const markdown = await c.req.text();
  const { html, frontmatter } = await remarked(markdown);
  c.header("x-frontmatter", JSON.stringify(frontmatter));
  return c.html(html);
});

Deno.serve(app.fetch);
