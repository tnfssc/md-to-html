import { Hono } from "hono";
import grayMatter from "gray-matter";
import { unified, type Plugin } from "unified";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkGemoji from "remark-gemoji";
import rehypeShiki from "@shikijs/rehype";
import rehypeMathjax from "rehype-mathjax";
import rehypeStringify from "rehype-stringify";
import remarkCodeTitle from "remark-code-title";
import remarkFrontmatter from "remark-frontmatter";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExtenalLinks from "rehype-external-links";
import { transformerTwoslash } from "@shikijs/twoslash";
import { transformerCopyButton } from "@rehype-pretty/transformers";
import { visit } from "unist-util-visit";

const rehypeImg: Plugin = () => {
  return (rootNode) => {
    visit(rootNode, (node) => {
      if (node.type !== "element") return;
      // @ts-expect-error - abc
      if (node.tagName !== "img") return;
      // @ts-expect-error - abc
      node.properties.referrerpolicy = "no-referrer";
      // @ts-expect-error - abc
      node.properties.class = "w-full rounded-xl";
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
        transformerCopyButton({ visibility: "always", feedbackDuration: 3000 }),
      ],
    })
    .use(rehypeImg)
    .use(rehypeAutolinkHeadings)
    .use(rehypeExtenalLinks)
    .use(rehypeStringify)
    .process(matter.content)
    .then(String);
  return {
    html,
    frontmatter: matter.data,
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

const envApiKey = process.env.API_KEY ?? "";

const app = new Hono().post("/", async (c) => {
  const apiKey = c.req.header("x-api-key") ?? "";
  if (!safeCompare(apiKey, envApiKey)) return c.json(void 0, 401);
  const markdown = await c.req.text();
  const { html, frontmatter } = await remarked(markdown);
  c.header("x-frontmatter", JSON.stringify(frontmatter));
  return c.html(html);
});

export default app;
