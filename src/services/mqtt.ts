import mqtt, { MqttClient } from "mqtt";
import type { MQTTMessage, MQTTCommand, ScheduleAction, MeasurementMessage } from "../types";

class MQTTService {
  private client: MqttClient | null = null;
  private isConnected: boolean = false;
  private topic: string;
  private brokerUrl: string;
  private measureTopic: string;
  private measurementListeners: Array<(m: MeasurementMessage) => void> = [];
  private lastMeasurement?: MeasurementMessage;

  constructor() {
    this.topic = import.meta.env.VITE_MQTT_TOPIC || "device/control";
    this.brokerUrl =
      import.meta.env.VITE_MQTT_BROKER_URL || "ws://localhost:8083/mqtt";
    this.measureTopic =
      import.meta.env.VITE_MQTT_MEASURE_TOPIC || "iot/energy/measurements";
  }

  /**
   * Conecta al broker MQTT
   */
  connect(): Promise<void> {
    if (this.client && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(this.brokerUrl, {
          clientId: `web-client-${Math.random().toString(16).substr(2, 8)}`,
          clean: true,
          reconnectPeriod: 1000,
        });

        this.client.on("connect", () => {
          this.isConnected = true;
          console.log("Conectado a MQTT broker");
          // Suscribirse a topic de mediciones para estado del relé y métricas
          this.client?.subscribe(this.measureTopic, (err) => {
            if (err) {
              console.error("Error al suscribirse a medidas:", err);
            } else {
              console.log("Suscrito a", this.measureTopic);
            }
          });
          resolve();
        });

        this.client.on("error", (error: Error) => {
          console.error("Error MQTT:", error);
          this.isConnected = false;
          reject(error);
        });

        this.client.on("close", () => {
          this.isConnected = false;
          console.log("Desconectado de MQTT broker");
        });

        this.client.on("message", (topic, payload) => {
          if (topic === this.measureTopic) {
            try {
              const raw = payload.toString();
              const parsed = JSON.parse(raw) as any;
              const measurement: MeasurementMessage = {
                voltage: Number(parsed.voltage ?? 0),
                current: Number(parsed.current ?? 0),
                power: Number(parsed.power ?? 0),
                energy: Number(parsed.energy ?? 0),
                relay: parsed.relay ?? false,
                timer_active:
                  typeof parsed.timer_active !== "undefined"
                    ? !!parsed.timer_active
                    : undefined,
                threshold_cut_enabled:
                  typeof parsed.threshold_cut_enabled !== "undefined"
                    ? !!parsed.threshold_cut_enabled
                    : undefined,
                timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : undefined,
              };
              this.lastMeasurement = measurement;
              this.measurementListeners.forEach((cb) => {
                try {
                  cb(measurement);
                } catch (e) {
                  console.error("Error en listener de measurement:", e);
                }
              });
            } catch (e) {
              console.error("Error parseando measurement MQTT:", e);
            }
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Desconecta del broker MQTT
   */
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      this.lastMeasurement = undefined;
      this.measurementListeners = [];
    }
  }

  /**
   * Envía un comando al dispositivo
   * @param command - Comando a enviar ('turn on', 'turn off', 'timer', 'schedule')
   * @param params - Parámetros adicionales (tiempo para timer/schedule)
   */
  async sendCommand(
    command: MQTTCommand,
    params: Record<string, unknown> = {}
  ): Promise<MQTTMessage> {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        reject(new Error("No conectado al broker MQTT"));
        return;
      }

      const message: MQTTMessage = {
        command,
        timestamp: new Date().toISOString(),
        ...params,
      };

      this.client.publish(this.topic, JSON.stringify(message), (error) => {
        if (error) {
          reject(error);
        } else {
          console.log("Comando enviado:", message);
          resolve(message);
        }
      });
    });
  }

  /**
   * Envía comando de encendido
   */
  async turnOn(): Promise<MQTTMessage> {
    return this.sendCommand("turn on");
  }

  /**
   * Envía comando de apagado
   */
  async turnOff(): Promise<MQTTMessage> {
    return this.sendCommand("turn off");
  }

  /**
   * Envía comando de timer
   * @param seconds - Segundos para el timer
   */
  async setTimer(seconds: number): Promise<MQTTMessage> {
    return this.sendCommand("timer", { seconds });
  }

  /**
   * Envía comando de schedule
   * @param scheduledTime - Fecha y hora programada (ISO base)
   * @param action - "on" | "off"
   */
  async setSchedule(
    scheduledTime: Date,
    action: ScheduleAction
  ): Promise<MQTTMessage> {
    const now = Date.now();
    const diffMs = scheduledTime.getTime() - now;
    const delaySeconds = Math.max(1, Math.ceil(diffMs / 1000));
    return this.sendCommand("schedule", {
      scheduledTime: scheduledTime.toISOString(),
      action,
      delaySeconds,
    });
  }

  /**
   * Habilita/Deshabilita el corte por threshold en el dispositivo
   */
  async setThresholdCutEnabled(enabled: boolean): Promise<MQTTMessage> {
    return this.sendCommand("threshold_cut", { enabled });
  }

  /**
   * Suscribe un listener a las mediciones del dispositivo (incluye estado del relé).
   * Devuelve una función para desuscribirse.
   */
  onMeasurement(listener: (m: MeasurementMessage) => void): () => void {
    this.measurementListeners.push(listener);
    // Emitir la última medición si existe
    if (this.lastMeasurement) {
      try {
        listener(this.lastMeasurement);
      } catch (e) {
        console.error("Error entregando última medición:", e);
      }
    }
    return () => {
      this.measurementListeners = this.measurementListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Última medición conocida (si la hay)
   */
  getLastMeasurement(): MeasurementMessage | undefined {
    return this.lastMeasurement;
  }
}

// Instancia singleton
const mqttService = new MQTTService();

export default mqttService;
