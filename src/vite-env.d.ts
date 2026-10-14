/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_ENDPOINT?: string
  readonly VITE_KAKAO_REST_API_KEY?: string
  readonly VITE_KAKAO_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
