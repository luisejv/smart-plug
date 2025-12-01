# IoT Energy Monitor PWA

Aplicación web progresiva (PWA) desarrollada en TypeScript para monitorear y controlar el consumo energético de dispositivos IoT.

## Características

- 📊 Visualización de consumo diario y mensual en kWh y Soles
- 📈 Gráficas interactivas con Chart.js
- 🎛️ Control remoto de dispositivos mediante MQTT
- 📱 Diseño responsive optimizado para móviles
- 🎨 Interfaz moderna estilo Uber (oscura y minimalista)
- ⚡ PWA instalable con soporte offline

## Comandos MQTT

La aplicación permite enviar los siguientes comandos:

- **Turn On**: Encender el dispositivo
- **Turn Off**: Apagar el dispositivo
- **Timer**: Activar un temporizador con tiempo configurable (en minutos)
- **Schedule**: Programar una acción para una fecha y hora específica

## Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_API_BASE_URL=http://tu-api.com/api
VITE_CONVERSION_FACTOR=0.5
VITE_MQTT_BROKER_URL=ws://tu-broker-mqtt.com:8083/mqtt
VITE_MQTT_TOPIC=device/control
```

- `VITE_API_BASE_URL`: URL base de tu API para obtener datos de consumo
- `VITE_CONVERSION_FACTOR`: Factor de conversión de kWh a Soles (ejemplo: 0.5)
- `VITE_MQTT_BROKER_URL`: URL del broker MQTT (WebSocket)
- `VITE_MQTT_TOPIC`: Tópico MQTT para enviar comandos

### Instalación

Si usas `nvm` (Node Version Manager), puedes cambiar automáticamente a la versión correcta de Node.js:

```bash
nvm use
```

Luego instala las dependencias:

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Build para Producción

```bash
npm run build
```

El build generará los archivos en la carpeta `dist/`, listos para desplegar.

## Estructura del Proyecto

```
├── src/
│   ├── components/
│   │   ├── ConsumptionView.tsx     # Vista de consumo con gráficas
│   │   └── MQTTControl.tsx        # Módulo de control MQTT
│   ├── services/
│   │   ├── api.ts                 # Servicio de API
│   │   └── mqtt.ts                # Servicio MQTT
│   ├── types/
│   │   └── index.ts               # Definiciones de tipos TypeScript
│   ├── App.tsx                    # Componente principal
│   ├── main.tsx                   # Punto de entrada
│   ├── vite-env.d.ts             # Tipos de Vite
│   └── index.css                  # Estilos globales
├── index.html
├── vite.config.ts                 # Configuración de Vite y PWA
├── tsconfig.json                  # Configuración de TypeScript
└── package.json
```

## API Esperada

La aplicación espera que tu API responda con el siguiente formato:

### Consumo Diario

```
GET /api/consumption/daily?deviceId=device-001&date=2024-01-15T00:00:00.000Z

Response: [
  {
    hour: 0,
    consumption: 1.5,
    timestamp: "2024-01-15T00:00:00.000Z"
  },
  ...
]
```

### Consumo Mensual

```
GET /api/consumption/monthly?deviceId=device-001&month=1&year=2024

Response: [
  {
    day: 1,
    consumption: 12.5,
    timestamp: "2024-01-01T00:00:00.000Z"
  },
  ...
]
```

## Formato de Comandos MQTT

Los comandos se envían como JSON al tópico configurado:

```json
{
  "command": "turn on",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

```json
{
  "command": "timer",
  "minutes": 30,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

```json
{
  "command": "schedule",
  "scheduledTime": "2024-01-15T18:00:00.000Z",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Requisitos

- **Node.js**: 20.18.0 o superior (especificado en `.nvmrc`)
- **npm**: 10.x o superior

Si usas `nvm`, ejecuta `nvm use` para cambiar automáticamente a la versión correcta.

## Notas

- Si la API no está disponible, la aplicación usará datos simulados para demostración
- La aplicación está configurada para un solo dispositivo (device-001) por ahora
- El diseño está optimizado para móviles pero funciona en desktop
