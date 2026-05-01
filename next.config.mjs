/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  /* config options here */
  turbopack: {
    // Prevent Turbopack from guessing a parent workspace root on Windows.
    root: projectRoot,
  },
};

export default nextConfig;
