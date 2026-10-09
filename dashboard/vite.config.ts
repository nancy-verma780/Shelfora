import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Single-file build so the prototype can be hosted anywhere as one HTML page.
export default defineConfig({ plugins: [react(), viteSingleFile()] });
