import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The site has no server work: no route handlers, no server actions, no
   * per-request data. Exporting to static files means Cloudflare serves it
   * straight from the edge with no Worker runtime in the request path.
   */
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  trailingSlash: true,
};

export default nextConfig;
