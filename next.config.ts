import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow dev HMR from local network IP (used when accessing via device IP)
  // Replace or extend this array if you use other hosts in development.
  allowedDevOrigins: ["192.168.1.116"],

  // Content Security Policy headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: process.env.NODE_ENV === "development"
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss: http: https:;"
              : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
