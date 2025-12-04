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

export interface MinuteConsumptionData {
  timestamp: Date;
  consumption: number;
}

export interface LatestMeasurement {
  timestamp: string | Date;
  voltage: number;
  current: number;
  power: number;
  energy: number; // acumulador del PZEM
  session_energy_kwh?: number; // igual a energy según backend
  relay: number | boolean;
  relay_bool?: boolean;
}

export type ViewMode = "daily" | "minute" | "monthly";
export type Unit = "kwh" | "soles";

export type MQTTCommand =
  | "turn on"
  | "turn off"
  | "timer"
  | "schedule"
  | "threshold_cut";

export type ScheduleAction = "on" | "off";

export interface MQTTMessage {
  command: MQTTCommand;
  timestamp: string;
  seconds?: number;
  scheduledTime?: string;
  action?: ScheduleAction;
  delaySeconds?: number;
  enabled?: boolean; // para threshold_cut
}

export interface MeasurementMessage {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  relay: number | boolean;
  timer_active?: boolean;
  threshold_cut_enabled?: boolean;
  timestamp?: string;
}

export interface LastCommand {
  type: "turnOn" | "turnOff" | "timer" | "schedule";
  timestamp: Date;
  params?: Record<string, unknown>;
}
