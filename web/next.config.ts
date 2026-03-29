import type { NextConfig } from "next";

/** API is proxied in app/api/[[...path]]/route.ts so an unreachable backend returns 503 JSON instead of a rewrite 500. */
const nextConfig: NextConfig = {};

export default nextConfig;
