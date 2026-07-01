import { defineConfig } from "tsup";

// Bundle the SDK source into ESM + type declarations for npm. Runtime deps
// (@noble/*, @scure/bip39) and the phoenix peer dep are left external — consumers
// install them — so the published bundle is just Pochta's own code.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
