import type { DailyConsumptionData, MonthlyConsumptionData } from "../types";

// Configuración de la API
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

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
  deviceId: string,
  date: Date
): Promise<DailyConsumptionData[]> {
  try {
    // Simulación de datos - Reemplazar con llamada real a la API
    const response = await fetch(
      `${API_BASE_URL}/consumption/daily?deviceId=${deviceId}&date=${date.toISOString()}`
    );

    if (!response.ok) {
      // Si la API no está disponible, retornar datos simulados
      return generateMockDailyData(date);
    }

    const data = await response.json();
    return data as DailyConsumptionData[];
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
  deviceId: string,
  date: Date
): Promise<MonthlyConsumptionData[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/consumption/monthly?deviceId=${deviceId}&month=${
        date.getMonth() + 1
      }&year=${date.getFullYear()}`
    );

    if (!response.ok) {
      return generateMockMonthlyData(date);
    }

    const data = await response.json();
    return data as MonthlyConsumptionData[];
  } catch (error) {
    console.warn("API no disponible, usando datos simulados:", error);
    return generateMockMonthlyData(date);
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
