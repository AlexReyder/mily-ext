import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: "src",
  entrypointsDir: "entries",
  modulesDir: "wxt-modules",
  outDir: "dist",
  manifest: {
    permissions: ["tabs"],
  },
  vite: () => ({
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
      }),
      react(),
      tailwindcss(),
    ],
  }),
});