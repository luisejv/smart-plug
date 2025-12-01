import mqtt, { MqttClient } from "mqtt";
import type { MQTTMessage, MQTTCommand } from "../types";

class MQTTService {
  private client: MqttClient | null = null;
  private isConnected: boolean = false;
  private topic: string;
  private brokerUrl: string;

  constructor() {
    this.topic = import.meta.env.VITE_MQTT_TOPIC || "device/control";
    this.brokerUrl =
      import.meta.env.VITE_MQTT_BROKER_URL || "ws://localhost:8083/mqtt";
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
   * @param minutes - Minutos para el timer
   */
  async setTimer(minutes: number): Promise<MQTTMessage> {
    return this.sendCommand("timer", { minutes });
  }

  /**
   * Envía comando de schedule
   * @param scheduledTime - Fecha y hora programada
   */
  async setSchedule(scheduledTime: Date): Promise<MQTTMessage> {
    return this.sendCommand("schedule", {
      scheduledTime: scheduledTime.toISOString(),
    });
  }
}

// Instancia singleton
const mqttService = new MQTTService();

export default mqttService;
