import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack이 사용하는 워크스페이스 루트를 명시적으로 지정
  // => 항상 C:\Users\seonaru\Desktop\nomenterra 기준으로 동작
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
