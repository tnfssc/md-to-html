import { describe, expect, test } from "bun:test";

import app, { safeCompare } from "./index";

describe("safeCompare", () => {
  test("returns true for identical strings", () => {
    expect(safeCompare("abc", "abc")).toBe(true);
  });
  test("returns false for different strings", () => {
    expect(safeCompare("abc", "abd")).toBe(false);
  });
  test("returns false for different lengths", () => {
    expect(safeCompare("abc", "abcd")).toBe(false);
  });
});

describe("Hono App", () => {
  const TEST_API_KEY = "test-secret";

  test("POST / without API key returns 401", async () => {
    process.env.API_KEY = TEST_API_KEY;
    const res = await app.request("/", {
      body: "# Hello",
      headers: {
        "x-api-key": "wrong-key",
      },
      method: "POST",
    });
    expect(res.status).toBe(401);
  });

  test("POST / with correct API key returns 200 and HTML", async () => {
    const res = await app.request("/", {
      body: "---\ntitle: Test\n---\n# Hello World",
      headers: {
        "x-api-key": process.env.API_KEY ?? "",
      },
      method: "POST",
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("<h1>Hello World</h1>");
    expect(res.headers.get("x-frontmatter")).toContain("Test");
  });

  test("POST / processes images correctly", async () => {
    process.env.API_KEY = "";
    const res = await app.request("/", {
      body: "![alt text](https://example.com/image.png)",
      method: "POST",
    });
    const body = await res.text();
    expect(body).toContain('referrerpolicy="no-referrer"');
    expect(body).toContain('class="w-full rounded-xl"');
  });
});
