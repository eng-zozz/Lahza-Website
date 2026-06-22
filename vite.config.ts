import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Standalone Vite config (previously wrapped by @lovable.dev/vite-tanstack-config).
// Deploy target: Vercel. Server entry stays at src/server.ts (SSR error wrapper).
export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    nitro({ preset: "vercel" }),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
