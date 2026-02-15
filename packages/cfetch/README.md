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

1. Install the integration **automatically** using the Astro CLI:

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

2. Install peer dependencies

If your package manager does not automatically install peer dependencies, you will need to ensure `Effect` is installed.

```bash
pnpm add effect
```

```bash
npm install effect
```

```bash
yarn add effect
```

3. Add the integration to your astro config

```diff
+import cFetch from "@studiocms/cfetch";

export default defineConfig({
  integrations: [
+    cFetch(),
  ],
});
```

### Usage

This integration includes various versions of cached fetch functions and [Effects](https://effect.website) to allow full control of how you work with your data.

#### Effects

All Effects have the following return pattern or derivatives there of

```ts
Effect.Effect<CachedResponse<T>, FetchError, never>;
```

##### `CachedResponse<T>` type

```ts
interface CachedResponse<T> {
  data: T;
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
```

##### `CFetchConfig` type

```ts
interface CFetchConfig {
  forceCache?: true | undefined;
  ttl?: Duration.DurationInput;
  tags?: string[];
  key?: string;
  verbose?: boolean;
}
```

> [!NOTE]
> By default only `GET` and `HEAD` requests are cached. You can change that by setting `forceCache` to `true`.

##### `InvalidateCacheOptions` type

```ts
interface InvalidateCacheOptions {
	keys?: string[];
	tags?: string[];
}
```

##### `cFetchEffect`

###### Interface

```ts
const cFetchEffect: <T>(
  url: string | URL, 
  parser: (response: Response) => Promise<T>, 
  options?: RequestInit | undefined, 
  cacheConfig?: CFetchConfig | undefined
) => Effect.Effect<CachedResponse<T>, FetchError, never>
```

###### Example Usage

```ts
import { cFetchEffect, Duration } from "c:fetch"

const effect = cFetchEffect<{ foo: string; bar: number; }>(
  'https://api.example.com/data',
  (res) => res.json(),
  { method: "GET" },
  { ttl?: Duration.hours(1), tags?: ['example'], key?: "api-data-fetch", verbose?: false }
);
/*
Return type:
  Effect.Effect<CachedResponse<{ foo: string; bar: number; }>, FetchError, never>
*/
```

##### `invalidateCacheEffect`

###### Interface

```ts
const invalidateCacheEffect: (opts: InvalidateCacheOptions) => Effect.Effect<void, never, never>
```

###### Example Usage

```ts
const effect = invalidateCacheEffect({
  tags: ['user'],
  keys: ['user:123', 'user:456']
})
/*
Return type:
  Effect.Effect<void, never, never>
*/
```

##### `cFetchEffectJson`

###### Interface

```ts
const cFetchEffectJson: <T>(
  url: string | URL, 
  options?: RequestInit | undefined, 
  cacheConfig?: CFetchConfig | undefined
) => Effect.Effect<CachedResponse<T>, FetchError, never>
```

###### Example Usage

```ts
import { cFetchEffectJson } from "c:fetch"

const effect = cFetchEffectJson<{ foo: string; bar: number; }>(
  'https://api.example.com/data',
  { method: "GET" }
);
/*
Return type:
  Effect.Effect<CachedResponse<{ foo: string; bar: number; }>, FetchError, never>
*/
```

##### `cFetchEffectText`

###### Interface

```ts
const cFetchEffectText: (
  url: string | URL, 
  options?: RequestInit | undefined, 
  cacheConfig?: CFetchConfig | undefined
) => Effect.Effect<CachedResponse<string>, FetchError, never>
```

###### Example Usage

```ts
import { cFetchEffectText } from "c:fetch"

const effect = cFetchEffectText(
  'https://example.com',
  { method: "GET" }
);
/*
Return type:
  Effect.Effect<CachedResponse<string>, FetchError, never>
*/
```

##### `cFetchEffectBlob`

###### Interface

```ts
const cFetchEffectBlob: (
  url: string | URL, 
  options?: RequestInit | undefined, 
  cacheConfig?: CFetchConfig | undefined
) => Effect.Effect<CachedResponse<Blob>, FetchError, never>
```

###### Example Usage

```ts
import { cFetchEffectBlob } from "c:fetch"

const effect = cFetchEffectBlob(
  'https://example.com/image.png',
  { method: "GET" }
);
/*
Return type:
  Effect.Effect<CachedResponse<Blob>, FetchError, never>
*/
```

#### Functions

All Functions have the following return pattern or derivatives there of

```ts
CachedResponse<T>;
```

##### `cFetch`

###### Interface

```ts
const cFetch: <T>(
  url: string | URL, 
  parser: (response: Response) => Promise<T>, 
  options?: RequestInit | undefined, 
  cacheConfig?: CFetchConfig | undefined
) => Promise<CachedResponse<T>>
```

###### Example Usage

```ts
import { cFetch } from "c:fetch"

const response = await cFetch<{ foo: string; bar: number; }>(
  'https://api.example.com/data',
  (res) => res.json(),
  { method: "GET" }
);
/*
Return type:
  CachedResponse<{ foo: string; bar: number; }>
*/
```

##### `cFetchJson`

###### Interface

```ts
const cFetchJson: <T>(
  url: string | URL, 
  options?: RequestInit | undefined, 
  cacheConfig?: CFetchConfig | undefined
) => Promise<CachedResponse<T>>
```

###### Example Usage

```ts
import { cFetchJson } from "c:fetch"

const response = await cFetchJson<{ foo: string; bar: number; }>(
  'https://api.example.com/data',
  { method: "GET" }
);
/*
Return type:
  CachedResponse<{ foo: string; bar: number; }>
*/
```

##### `cFetchText`

###### Interface

```ts
const cFetchText: (
  url: string | URL, 
  options?: RequestInit | undefined, 
  cacheConfig?: CFetchConfig | undefined
) => Promise<CachedResponse<string>>
```

###### Example Usage

```ts
import { cFetchText } from "c:fetch"

const response = await cFetchText(
  'https://example.com',
  { method: "GET" }
);
/*
Return type:
  CachedResponse<string>
*/
```

##### `cFetchBlob`

###### Interface

```ts
const cFetchBlob: (
  url: string | URL, 
  options?: RequestInit | undefined, 
  cacheConfig?: CFetchConfig | undefined
) => Promise<CachedResponse<Blob>>
```

###### Example Usage

```ts
import { cFetchBlob } from "c:fetch"

const response = await cFetchBlob(
  'https://example.com/image.png',
  { method: "GET" }
);
/*
Return type:
  CachedResponse<Blob>
*/
```

##### `invalidateCache`

###### Interface

```ts
const invalidateCache: (opts: InvalidateCacheOptions) => Promise<void>
```

###### Example Usage

```ts
const res = await invalidateCache({
  tags: ['user'],
  keys: ['user:123', 'user:456']
})
/*
Return type:
  void
*/
```

## Licensing

[MIT Licensed](https://github.com/withstudiocms/cfetch/blob/main/LICENSE).
