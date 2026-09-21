import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '172.168.25.73',
    '172.168.25.73:3000',
    'localhost:3000',
    '*.loca.lt',
    '*.trycloudflare.com',
    '*.ngrok-free.app',
    '*.ngrok.app',
  ],
};

export default nextConfig;
