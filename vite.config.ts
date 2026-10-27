import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type ViteDevServer } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { handlePlaygroundRequest } from "./server/playground.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function playgroundApi() {
  return {
    name: "devwell-playground-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/playground/run", (req, res, next) => {
        void handlePlaygroundRequest(req).then(({ status, body }) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.end(JSON.stringify(body));
        }).catch(next);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [playgroundApi(), react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
