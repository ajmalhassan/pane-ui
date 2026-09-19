import nextra from "nextra";
const withNextra = nextra({ search: { codeblocks: false } });
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the file-tracing root to this project so a lockfile above it is never inferred as the workspace root.
  outputFileTracingRoot: import.meta.dirname,
  async redirects() {
    return [{ source: "/start", destination: "/", permanent: true }];
  },
  images: {
    // 75 is next/image's own default, used everywhere else; 30 is the
    // Photography backdrop's, a layer greyscale, blurred 24px and painted at
    // 12%, where the drop is invisible. Required from Next.js 16 on.
    qualities: [30, 75],
  },
};

export default withNextra(nextConfig);
