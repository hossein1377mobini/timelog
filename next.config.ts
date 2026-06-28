import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allowedDevOrigins: ["192.168.1.116", "192.168.52.65"],

  // async headers() {
  //   return [
  //     {
  //       source: "/:path*",
  //       headers: [
  //         {
  //           key: "Content-Security-Policy",
  //           value: process.env.NODE_ENV === "development"
  //             ? [
  //                 "default-src 'self'",
  //                 "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  //                 "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  //                 "img-src 'self' data: https:",
  //                 "font-src 'self' https://fonts.gstatic.com",
  //                 "connect-src 'self' ws: wss: http: https:",
  //               ].join("; ")
  //             : [
  //                 "default-src 'self'",
  //                 "script-src 'self'",
  //                 "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  //                 "img-src 'self' data: https:",
  //                 "font-src 'self' https://fonts.gstatic.com",
  //                 "connect-src 'self' https:",
  //               ].join("; "),
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;