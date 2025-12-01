export interface DailyConsumptionData {
  hour: number;
  consumption: number;
  timestamp: Date;
}

export interface MonthlyConsumptionData {
  day: number;
  consumption: number;
  timestamp: Date;
}

export type ViewMode = "daily" | "monthly";
export type Unit = "kwh" | "soles";

export type MQTTCommand = "turn on" | "turn off" | "timer" | "schedule";

export interface MQTTMessage {
  command: MQTTCommand;
  timestamp: string;
  minutes?: number;
  scheduledTime?: string;
}

export interface LastCommand {
  type: "turnOn" | "turnOff" | "timer" | "schedule";
  timestamp: Date;
  params?: Record<string, unknown>;
}
