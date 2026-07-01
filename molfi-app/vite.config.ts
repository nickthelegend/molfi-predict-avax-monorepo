/// <reference types="vitest/config" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const mystenUtils = path.resolve(appRoot, "node_modules/@mysten/utils");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    define: envDefine,
    server: {
      host: "::",
      port: 8080,
    },
    resolve: {
      alias: {
        "@": `${process.cwd()}/src`,
        // Enoki bundles @mysten/utils@0.2.x without `mitt`; hoist 0.3.x for Vite prebundle.
        "@mysten/utils": mystenUtils,
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
        "@mysten/utils",
      ],
    },
    plugins: [
      tailwindcss(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      // @stellar/stellar-sdk needs Node Buffer/global/process in the browser.
      nodePolyfills({ globals: { Buffer: true, global: true, process: true } }),
    ],
    test: {
      environment: "node",
      include: ["src/**/*.spec.ts"],
    },
  };
});
