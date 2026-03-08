import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/";
let apiHostConfig: { protocol: "http" | "https"; hostname: string; port?: string } | null = null;

try {
  const parsedApiUrl = new URL(apiUrl);
  apiHostConfig = {
    protocol: parsedApiUrl.protocol.replace(':', '') as "http" | "https",
    hostname: parsedApiUrl.hostname,
    port: parsedApiUrl.port || undefined,
  };
} catch {
  apiHostConfig = null;
}

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    remotePatterns: [
      ...(apiHostConfig
        ? [
            {
              protocol: apiHostConfig.protocol,
              hostname: apiHostConfig.hostname,
              port: apiHostConfig.port,
              pathname: "/**",
            },
          ]
        : []),
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pps.whatsapp.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
