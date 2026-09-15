import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Shared examples and the local package must use this application's React.
  resolve: { dedupe: ["react", "react-dom"] },
  server: { fs: { allow: [fileURLToPath(new URL("../..", import.meta.url))] } },
});
