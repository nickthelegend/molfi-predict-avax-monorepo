import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
        }) as any,
        NodeModulesPolyfillPlugin() as any,
      ],
    },
    exclude: ['usb'],
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "usb": path.resolve(__dirname, "./src/stubs/noop.js"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React and related libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // Separate chart libraries (they're huge!)
          'vendor-charts': ['recharts'],
          
          // Separate UI component libraries
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            'framer-motion',
          ],
          
          // Separate wallet/web3 libraries
          'vendor-web3': [
            '@creit.tech/stellar-wallets-kit',
            '@stellar/stellar-sdk',
            'ethers',
            'viem',
          ],
          
          // Separate date/time utilities
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase to 1000kb to reduce warnings
  },
}));
