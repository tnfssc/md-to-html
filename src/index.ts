import type { Element } from "hast";

import "hono";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { transformerCopyButton } from "@rehype-pretty/transformers";
import { Scalar } from "@scalar/hono-api-reference";
import rehypeShiki from "@shikijs/rehype";
import { transformerTwoslash } from "@shikijs/twoslash";
import grayMatter from "gray-matter";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExtenalLinks from "rehype-external-links";
import rehypeMathjax from "rehype-mathjax";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkCodeTitle from "remark-code-title";
import remarkFrontmatter from "remark-frontmatter";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type Plugin, unified } from "unified";
import { visit } from "unist-util-visit";

const rehypeImg: Plugin = () => {
  return (rootNode) => {
    visit(rootNode, "element", (node: Element) => {
      if (node.tagName !== "img") return;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      node.properties ||= {};
      node.properties.referrerPolicy = "no-referrer";
      node.properties.className = ["w-full", "rounded-xl"];
    });
    return rootNode;
  };
};

const remarked = async (md: string) => {
  const matter = grayMatter(md);

  const html = await unified()
    .use(remarkParse, { fragment: true })
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkGemoji)
    .use(remarkCodeTitle)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeMathjax)
    .use(rehypeShiki, {
      themes: { dark: "dark-plus", light: "dark-plus" },
      transformers: [
        transformerTwoslash({ explicitTrigger: true }),
        transformerCopyButton({ feedbackDuration: 3000, visibility: "always" }),
      ],
    })
    .use(rehypeImg)
    .use(rehypeAutolinkHeadings)
    .use(rehypeExtenalLinks)
    .use(rehypeStringify)
    .process(matter.content)
    .then(String);
  return {
    frontmatter: matter.data,
    html,
  };
};

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

const app = new OpenAPIHono();

const route = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "text/plain": {
          schema: z.string().openapi({
            example: "# Hello World",
          }),
        },
      },
    },
    headers: z.object({
      "x-api-key": z
        .string()
        .optional()
        .openapi({
          example: "your-api-key",
          param: {
            in: "header",
            name: "x-api-key",
          },
        }),
    }),
  },
  responses: {
    200: {
      content: {
        "text/html": {
          schema: z.string(),
        },
      },
      description: "HTML output",
      headers: z.object({
        "x-frontmatter": z.string().openapi({
          description: "JSON string of frontmatter",
        }),
      }),
    },
    401: {
      description: "Unauthorized",
    },
  },
});

app.openapi(route, async (c) => {
  const envApiKey = process.env.API_KEY ?? "";
  const apiKey = c.req.header("x-api-key") ?? "";

  if (!safeCompare(apiKey, envApiKey)) {
    return c.json(undefined, 401);
  }

  const markdown = await c.req.text();
  const { frontmatter, html } = await remarked(markdown);

  c.header("x-frontmatter", JSON.stringify(frontmatter));
  return c.html(html);
});

// The OpenAPI documentation will be available at /openapi.json
app.doc("/openapi.json", {
  info: {
    title: "MD to HTML API",
    version: "1.0.0",
  },
  openapi: "3.0.0",
});

// The Scalar reference will be available at /scalar
app.get(
  "/scalar",
  Scalar(() => ({ url: "/openapi.json" })),
);

export default app;
