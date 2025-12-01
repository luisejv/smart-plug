/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CONVERSION_FACTOR: string;
  readonly VITE_MQTT_BROKER_URL: string;
  readonly VITE_MQTT_TOPIC: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
