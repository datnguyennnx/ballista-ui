import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  
  // Configure API routes to proxy to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // Direct backend URL instead of env variable
      },
    ];
  },

  // CORS and security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },

  // Environment variables that should be available on the client
  publicRuntimeConfig: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
  },
};

export default config;
