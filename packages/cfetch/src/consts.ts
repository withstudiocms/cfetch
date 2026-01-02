import { Duration } from "effect";
import type { CacheConfig } from "./types";

export const defaultConfig: CacheConfig = {
    lifetime: Duration.hours(1),
}