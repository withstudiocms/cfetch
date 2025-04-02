# `@studiocms/cachedfetch`

This is an [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that provides a cacheable fetch function for Astro SSR

## Usage

### Prerequisites

- Using with an Astro SSR project

### Installation

Install the integration **automatically** using the Astro CLI:

```bash
pnpm astro add @studiocms/cachedfetch
```

```bash
npx astro add @studiocms/cachedfetch
```

```bash
yarn astro add @studiocms/cachedfetch
```

Or install it **manually**:

1. Install the required dependencies

```bash
pnpm add @studiocms/cachedfetch
```

```bash
npm install @studiocms/cachedfetch
```

```bash
yarn add @studiocms/cachedfetch
```

2. Add the integration to your astro config

```diff
+import astroCache from "@studiocms/cachedfetch";

export default defineConfig({
  integrations: [
+    astroCache(),
  ],
});
```

### Usage

You can import the cachedFetch function anywhere you would use a normal `fetch` call. `cachedFetch` adapts the same default options as fetch,

```astro
---
import { cachedFetch } from 'cached:fetch';

const response = await cachedFetch(
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
import { cachedFetch } from 'cached:fetch';

const { lastCheck, data: response } = await cachedFetch(
    'https://example.com', // string | URL | Request
    { /* Normal fetch init optional options here */ },
    { lifetime: "1h" }, // Optional, allows changing the default lifetime of the cache
    true
    );

const html = await response.text();
---
```


## Contributing

Install dependencies using pnpm: 

```bash
pnpm i --frozen-lockfile
```

Start the playground and package watcher:

```bash
pnpm dev
```

You can now edit files in `packages/cachedfetch`. Please note that making changes to those files may require restarting the playground dev server.

## Licensing

[MIT Licensed](https://github.com/withstudiocms/cachedfetch/blob/main/LICENSE).