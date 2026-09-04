/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the file-tracing root to this project so a lockfile above it is never inferred as the workspace root.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
