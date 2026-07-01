/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEVERX_PACKAGE_ID?: string;
  readonly VITE_LEVERX_REGISTRY_ID?: string;
  readonly VITE_LEVERX_VAULT_ID?: string;
  readonly VITE_LEVERX_FEE_COLLECTOR_ID?: string;
  /** Keeper HTTP base (proxies `/v1/*`). Preferred over `VITE_LEVERX_INDEXER_URL` when set. */
  readonly VITE_LEVERX_KEEPER_URL?: string;
  /** leverx-server REST base, or direct indexer host for WebSocket when using keeper REST. */
  readonly VITE_LEVERX_INDEXER_URL?: string;
  readonly VITE_LEVERX_INDEXER_WS_URL?: string;
  readonly VITE_PREDICT_ID?: string;
  readonly VITE_PREDICT_PACKAGE_ID?: string;
  readonly VITE_DEEPBOOK_INDEXER_URL?: string;
  readonly VITE_KEEPER_ADDRESS?: string;
  readonly VITE_KEEPER_API_KEY?: string;
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
  readonly VITE_ENOKI_API_KEY?: string;
  readonly VITE_ENOKI_GOOGLE_CLIENT_ID?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
