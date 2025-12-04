import type {
  DailyConsumptionData,
  MonthlyConsumptionData,
  MinuteConsumptionData,
  LatestMeasurement,
} from "../types";

// Configuración de la API
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Factor de conversión: kWh a Soles (ejemplo: 0.5 soles por kWh)
const CONVERSION_FACTOR = parseFloat(
  import.meta.env.VITE_CONVERSION_FACTOR || "0.5"
);

/**
 * Obtiene el consumo diario del dispositivo
 * @param deviceId - ID del dispositivo
 * @param date - Fecha para obtener el consumo
 * @returns Array de consumos por hora
 */
export async function getDailyConsumption(
  _deviceId: string,
  date: Date
): Promise<DailyConsumptionData[]> {
  try {
    const queryDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const response = await fetch(
      `${API_BASE_URL}/consumption/daily?date=${queryDate}`
    );

    if (!response.ok) {
      return generateMockDailyData(date);
    }

    const data = await response.json();
    // Adaptar timestamps a Date
    return (data as any[]).map((d) => ({
      hour: Number(d.hour),
      consumption: Number(d.consumption),
      timestamp: new Date(d.timestamp),
    }));
  } catch (error) {
    console.warn("API no disponible, usando datos simulados:", error);
    return generateMockDailyData(date);
  }
}

/**
 * Obtiene el consumo mensual del dispositivo
 * @param deviceId - ID del dispositivo
 * @param date - Fecha del mes a consultar
 * @returns Array de consumos por día
 */
export async function getMonthlyConsumption(
  _deviceId: string,
  date: Date
): Promise<MonthlyConsumptionData[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/consumption/monthly?month=${
        date.getMonth() + 1
      }&year=${date.getFullYear()}`
    );

    if (!response.ok) {
      return generateMockMonthlyData(date);
    }

    const data = await response.json();
    return (data as any[]).map((d) => ({
      day: Number(d.day),
      consumption: Number(d.consumption),
      timestamp: new Date(d.timestamp),
    }));
  } catch (error) {
    console.warn("API no disponible, usando datos simulados:", error);
    return generateMockMonthlyData(date);
  }
}

/**
 * Obtiene consumo agregado por minuto para los últimos N minutos
 */
export async function getMinuteConsumption(
  minutes: number = 60
): Promise<MinuteConsumptionData[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/consumption/minute?minutes=${minutes}`
    );
    if (!response.ok) {
      // Fallback: genera datos simulados por minuto
      const now = new Date();
      const start = new Date(now.getTime() - minutes * 60 * 1000);
      const arr: MinuteConsumptionData[] = [];
      let cursor = new Date(start);
      while (cursor <= now) {
        arr.push({
          timestamp: new Date(cursor),
          consumption: Math.random() * 0.01, // 0–10 Wh por minuto simulado
        });
        cursor = new Date(cursor.getTime() + 60 * 1000);
      }
      return arr;
    }
    const data = await response.json();
    return (data as any[]).map((d) => ({
      timestamp: new Date(d.timestamp),
      consumption: Number(d.consumption),
    }));
  } catch (error) {
    console.warn("API no disponible, usando datos simulados:", error);
    const now = new Date();
    const minutes = 60;
    const start = new Date(now.getTime() - minutes * 60 * 1000);
    const arr: MinuteConsumptionData[] = [];
    let cursor = new Date(start);
    while (cursor <= now) {
      arr.push({
        timestamp: new Date(cursor),
        consumption: Math.random() * 0.01,
      });
      cursor = new Date(cursor.getTime() + 60 * 1000);
    }
    return arr;
  }
}

/**
 * Genera datos simulados para consumo diario
 */
function generateMockDailyData(date: Date): DailyConsumptionData[] {
  const hours: DailyConsumptionData[] = [];
  for (let i = 0; i < 24; i++) {
    hours.push({
      hour: i,
      consumption: Math.random() * 2 + 0.5, // kWh entre 0.5 y 2.5
      timestamp: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        i
      ),
    });
  }
  return hours;
}

/**
 * Genera datos simulados para consumo mensual
 */
function generateMockMonthlyData(date: Date): MonthlyConsumptionData[] {
  const days: MonthlyConsumptionData[] = [];
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      consumption: Math.random() * 10 + 5, // kWh entre 5 y 15
      timestamp: new Date(date.getFullYear(), date.getMonth(), i),
    });
  }
  return days;
}

/**
 * Obtiene el factor de conversión
 */
export function getConversionFactor(): number {
  return CONVERSION_FACTOR;
}

/**
 * Convierte kWh a Soles
 */
export function convertToSoles(kwh: number): number {
  return kwh * CONVERSION_FACTOR;
}

/**
 * Última medición enriquecida (potencia, voltaje, corriente, energía de sesión)
 */
export async function getLatest(): Promise<LatestMeasurement | null> {
  try {
    const resp = await fetch(`${API_BASE_URL}/latest`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      ...data,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      voltage: Number(data.voltage ?? 0),
      current: Number(data.current ?? 0),
      power: Number(data.power ?? 0),
      energy: Number(data.energy ?? 0),
      session_energy_kwh: Number(data.session_energy_kwh ?? data.energy ?? 0),
      relay: data.relay ?? 0,
      relay_bool:
        typeof data.relay_bool !== "undefined"
          ? !!data.relay_bool
          : !!data.relay,
    } as LatestMeasurement;
  } catch {
    return null;
  }
}
