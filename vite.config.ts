// Workaround for environments where TypeScript can't find vite types
// @ts-ignore: suppress missing type declarations for 'vite'
const { defineConfig } = require("vite");

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
