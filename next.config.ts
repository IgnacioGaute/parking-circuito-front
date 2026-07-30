import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js's dev server refuses cross-origin requests by default (it's an
  // anti DNS-rebinding protection) — without this, loading the dev server
  // from anything other than localhost silently breaks React hydration
  // (the page renders its initial/loading state and never becomes
  // interactive, with no error shown). Needed for testing from a phone on
  // the LAN, and for the localtunnel HTTPS tunnel used to test PWA install.
  allowedDevOrigins: ['10.0.0.112', '*.loca.lt'],
  experimental: {
    serverActions: {
      // Separately, Server Actions have their own CSRF origin check that
      // needs the same origins allow-listed.
      allowedOrigins: ['10.0.0.112:3001', '*.loca.lt'],
    },
  },
};

export default nextConfig;
