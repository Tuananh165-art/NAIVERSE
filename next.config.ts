import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const requestedBuildDir = process.env.NAIVERSE_BUILD_DIST_DIR;
const buildDistDir = requestedBuildDir && /^\.next-[a-z0-9-]+$/.test(requestedBuildDir)
  ? requestedBuildDir
  : ".next";

const nextConfig: NextConfig = {
  distDir: buildDistDir,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { remotePatterns: [] },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/vi",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
