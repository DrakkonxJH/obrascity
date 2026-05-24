import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    const headers = [
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self)",
      },
    ];

    if (process.env.NODE_ENV === "production") {
      headers.push(
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
            value:
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
        },
      );
    }

    const crmProxyHeaders = headers.filter((header) => header.key !== "X-Frame-Options");
    if (process.env.NODE_ENV === "production") {
      for (let index = crmProxyHeaders.length - 1; index >= 0; index -= 1) {
        if (crmProxyHeaders[index]?.key === "Content-Security-Policy") {
          crmProxyHeaders.splice(index, 1);
        }
      }
      crmProxyHeaders.push({
        key: "Content-Security-Policy",
        value: "frame-ancestors 'self';",
      });
    }

    return [
      {
        source: "/api/crm/proxy/:path*",
        headers: crmProxyHeaders,
      },
      {
        source: "/((?!api/crm/proxy).*)",
        headers,
      },
    ];
  },
};

export default nextConfig;
