import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Module resolution walks up to the drive root looking for node_modules, and in
 * dev webpack asks the watcher to tell it if any of those candidates appear. On
 * Windows that means scanning C:\, where lstat on pagefile.sys and friends fails
 * with EINVAL and Watchpack prints an error per file on every startup.
 *
 * Next's default ignore list is glob-based ('**\/node_modules/**'), which never
 * matches a backslash path, so it does not prevent this. A regexp anchored on
 * the project root does: everything outside the project is ignored, which is
 * exactly the set of paths we have no reason to watch.
 */
const outsideProjectRoot = new RegExp(`^(?!${projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = { ...config.watchOptions, ignored: outsideProjectRoot };
    }
    return config;
  },
};

export default nextConfig;
