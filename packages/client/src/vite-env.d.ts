/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // add more VITE_ prefixed environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}