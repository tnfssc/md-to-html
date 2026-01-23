# md-to-html

> A high-performance Markdown to HTML converter microservice built with Hono and Bun.

<div align="center">

![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)

</div>

## ✨ Features

- **Fast**: Built on [Bun](https://bun.sh) and [Hono](https://hono.dev).
- **Rich Markdown**: Supports GFM, MathJax, Syntax Highlighting (Shiki), Emojis, and raw HTML.
- **Secure**: Basic API Key authentication using timing-safe comparison.
- **Extensible**: Powered by the [unified](https://unifiedjs.com/) ecosystem (remark/rehype).

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+

### Installation

```bash
git clone https://github.com/your-username/md-to-html.git
cd md-to-html
bun install
```

### Development

```bash
# Start the dev server
bun run dev

# Run tests
bun test

# Typecheck
bun run typecheck
```

## 🔌 API Usage

**POST** `/

Converts Markdown content in the body to HTML.

**Headers:**

- `x-api-key`: Your secret API key (matches `API_KEY` env var)
- `Content-Type`: `text/plain` or `text/markdown`

**Response:**

- `200 OK`: HTML string
- `x-frontmatter` header: JSON string of parsed frontmatter
- `401 Unauthorized`: Invalid or missing API key

**Example:**

```bash
curl -X POST http://localhost:3000/ \
  -H "x-api-key: your-secret-key" \
  -d "# Hello World"
```
