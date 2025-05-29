import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
    open: true,
  },
  define: {
    global: {},
  },
  plugins: [react()],
});
