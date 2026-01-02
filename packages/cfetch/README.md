# `@studiocms/cfetch`

![Readme's Banner](https://github.com/withstudiocms/cfetch/blob/main/assets/cfetch-banner.png)

[![NPM Version](https://img.shields.io/npm/v/@studiocms/cfetch?logo=npm)](https://npm.im/@studiocms/cfetch)
[![JSR](https://jsr.io/badges/@studiocms/cfetch)](https://jsr.io/@studiocms/cfetch)
[![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)

This is an [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that provides a cacheable fetch function for Astro SSR

## Usage

### Prerequisites

- Using with an Astro SSR project, While you could import and use this in an Astro SSG (static) project, it would have no benefit as Astro Static pages are pre-rendered.

### Installation

Install the integration **automatically** using the Astro CLI:

```bash
pnpm astro add @studiocms/cfetch
```

```bash
npx astro add @studiocms/cfetch
```

```bash
yarn astro add @studiocms/cfetch
```

Or install it **manually**:

1. Install the required dependencies

```bash
pnpm add @studiocms/cfetch
```

```bash
npm install @studiocms/cfetch
```

```bash
yarn add @studiocms/cfetch
```

2. Add the integration to your astro config

```diff
+import cFetch from "@studiocms/cfetch";

export default defineConfig({
  integrations: [
+    cFetch(),
  ],
});
```

### Usage

TODO

## Licensing

[MIT Licensed](https://github.com/withstudiocms/cfetch/blob/main/LICENSE).
