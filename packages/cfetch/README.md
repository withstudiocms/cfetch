# `@studiocms/cfetch`

This is an [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that provides a cacheable fetch function for Astro SSR

## Usage

### Prerequisites

- Using with an Astro SSR project

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

You can import the cachedFetch function anywhere you would use a normal `fetch` call. `cfetch` adapts the same default options as fetch,

```astro
---
import { cFetch } from 'cached:fetch';

const response = await cFetch(
    'https://example.com', // string | URL | Request
    { /* Normal fetch init optional options here */ },
    { lifetime: "1h" } // Optional, allows changing the default lifetime of the cache
    );

const html = await response.text();
---
```

If you are also wanting the other available metadata (such as `lastChecked` value which is the last time the cache was updated) then you can add the following prop to cached fetch, changing the shape of the data output to the following:

```astro
---
import { cFetch } from 'cached:fetch';

const { lastCheck, data: response } = await cFetch(
    'https://example.com', // string | URL | Request
    { /* Normal fetch init optional options here */ },
    { lifetime: "1h" }, // Optional, allows changing the default lifetime of the cache
    true
    );

const html = await response.text();
---
```

## Licensing

[MIT Licensed](https://github.com/withstudiocms/cfetch/blob/main/LICENSE).