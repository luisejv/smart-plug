import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  getDailyConsumption,
  getMonthlyConsumption,
  getMinuteConsumption,
  getLatest,
  convertToSoles,
} from "../services/api";
import type {
  ViewMode,
  Unit,
  DailyConsumptionData,
  MonthlyConsumptionData,
  MinuteConsumptionData,
} from "../types";
import "./ConsumptionView.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DEVICE_ID = "device-001"; // ID del dispositivo único

export default function ConsumptionView() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [unit, setUnit] = useState<Unit>("kwh");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyData, setDailyData] = useState<DailyConsumptionData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyConsumptionData[]>([]);
  const [minuteData, setMinuteData] = useState<MinuteConsumptionData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefreshMs] = useState<number>(10_000); // 10 segundos
  const [latest, setLatest] = useState<{
    power?: number;
    voltage?: number;
    current?: number;
    session?: number;
    relay?: boolean;
  }>({});

  useEffect(() => {
    loadData();
  }, [viewMode, selectedDate]);

  // Auto-refresh cada minuto
  useEffect(() => {
    const id = setInterval(() => {
      loadData(true);
    }, autoRefreshMs);
    return () => clearInterval(id);
  }, [viewMode, selectedDate, autoRefreshMs]);

  const loadData = async (isAuto: boolean = false): Promise<void> => {
    if (!isAuto) setLoading(true);
    try {
      // Última medición (resumen)
      const last = await getLatest();
      if (last) {
        setLatest({
          power: last.power,
          voltage: last.voltage,
          current: last.current,
          session: last.session_energy_kwh ?? last.energy,
          relay: last.relay_bool ?? !!last.relay,
        });
      }
      if (viewMode === "daily") {
        const data = await getDailyConsumption(DEVICE_ID, selectedDate);
        setDailyData(data);
      } else if (viewMode === "monthly") {
        const data = await getMonthlyConsumption(DEVICE_ID, selectedDate);
        setMonthlyData(data);
      } else if (viewMode === "minute") {
        const data = await getMinuteConsumption(60);
        setMinuteData(data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      if (!isAuto) setLoading(false);
    }
  };

  const chartData = () => {
    if (viewMode === "daily") {
      const labels = dailyData.map((d) => `${d.hour}:00`);
      const consumption = dailyData.map((d) =>
        unit === "kwh" ? d.consumption : convertToSoles(d.consumption)
      );

      return {
        labels,
        datasets: [
          {
            label: unit === "kwh" ? "Consumo (kWh)" : "Costo (Soles)",
            data: consumption,
            borderColor: "#0066FF",
            backgroundColor: "rgba(0, 102, 255, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#0066FF",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
          },
        ],
      };
    } else if (viewMode === "monthly") {
      const labels = monthlyData.map((d) =>
        format(d.timestamp, "d MMM", { locale: es })
      );
      const consumption = monthlyData.map((d) =>
        unit === "kwh" ? d.consumption : convertToSoles(d.consumption)
      );

      return {
        labels,
        datasets: [
          {
            label: unit === "kwh" ? "Consumo (kWh)" : "Costo (Soles)",
            data: consumption,
            borderColor: "#0066FF",
            backgroundColor: "rgba(0, 102, 255, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#0066FF",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 2,
          },
        ],
      };
    } else {
      // minute
      const labels = minuteData.map((d) => format(d.timestamp, "HH:mm"));
      const consumption = minuteData.map((d) =>
        unit === "kwh" ? d.consumption : convertToSoles(d.consumption)
      );
      return {
        labels,
        datasets: [
          {
            label: unit === "kwh" ? "Consumo (kWh por minuto)" : "Costo (Soles por minuto)",
            data: consumption,
            borderColor: "#00CC66",
            backgroundColor: "rgba(0, 204, 102, 0.1)",
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 3,
          },
        ],
      };
    }
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "#0066FF",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#999999",
          font: {
            size: 11,
          },
        },
      },
      y: {
        border: {
          display: false,
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#999999",
          font: {
            size: 11,
          },
        },
        beginAtZero: true,
      },
    },
  };

  const totalConsumption = (): string => {
    if (viewMode === "daily") {
      const total = dailyData.reduce((sum, d) => sum + d.consumption, 0);
      return unit === "kwh"
        ? total.toFixed(3)
        : convertToSoles(total).toFixed(2);
    } else if (viewMode === "monthly") {
      const total = monthlyData.reduce((sum, d) => sum + d.consumption, 0);
      return unit === "kwh"
        ? total.toFixed(3)
        : convertToSoles(total).toFixed(2);
    } else {
      const total = minuteData.reduce((sum, d) => sum + d.consumption, 0);
      return unit === "kwh"
        ? total.toFixed(4)
        : convertToSoles(total).toFixed(2);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  return (
    <div className="consumption-view">
      {/* Selector de vista y unidad */}
      <div className="consumption-controls">
        <div className="view-selector">
          <button
            className={`view-button ${viewMode === "daily" ? "active" : ""}`}
            onClick={() => setViewMode("daily")}
          >
            Diario
          </button>
          <button
            className={`view-button ${viewMode === "minute" ? "active" : ""}`}
            onClick={() => setViewMode("minute")}
          >
            Minuto
          </button>
          <button
            className={`view-button ${viewMode === "monthly" ? "active" : ""}`}
            onClick={() => setViewMode("monthly")}
          >
            Mensual
          </button>
        </div>

        <div className="unit-selector">
          <button
            className={`unit-button ${unit === "kwh" ? "active" : ""}`}
            onClick={() => setUnit("kwh")}
          >
            kWh
          </button>
          <button
            className={`unit-button ${unit === "soles" ? "active" : ""}`}
            onClick={() => setUnit("soles")}
          >
            Soles
          </button>
        </div>
      </div>

      {/* Métricas en vivo */}
      <div className="summary-card metrics-grid">
        <div>
          <div className="summary-label">Potencia</div>
          <div className="summary-value">{(latest.power ?? 0).toFixed(1)} W</div>
        </div>
        <div>
          <div className="summary-label">Voltaje</div>
          <div className="summary-value">{(latest.voltage ?? 0).toFixed(1)} V</div>
        </div>
        <div>
          <div className="summary-label">Corriente</div>
          <div className="summary-value">{(latest.current ?? 0).toFixed(2)} A</div>
        </div>
        <div>
          <div className="summary-label">Sesión</div>
          <div className="summary-value">{(latest.session ?? 0).toFixed(3)} kWh</div>
        </div>
        <div>
          <div className="summary-label">Relé</div>
          <div className="summary-value">{latest.relay ? "ON" : "OFF"}</div>
        </div>
      </div>

      {/* Selector de fecha (no aplica en vista por minuto) */}
      {viewMode !== "minute" && (
        <div className="date-selector">
          <input
            type={viewMode === "daily" ? "date" : "month"}
            value={
              viewMode === "daily"
                ? format(selectedDate, "yyyy-MM-dd")
                : format(selectedDate, "yyyy-MM")
            }
            onChange={handleDateChange}
            className="date-input"
          />
        </div>
      )}

      {/* Tarjeta de resumen */}
      <div className="summary-card">
        <div className="summary-label">
          {viewMode === "daily"
            ? "Consumo Total del Día"
            : viewMode === "monthly"
            ? "Consumo Total del Mes"
            : "Consumo Total (últ. 60 min)"}
        </div>
        <div className="summary-value">
          {totalConsumption()} {unit === "kwh" ? "kWh" : "Soles"}
        </div>
      </div>

      {/* Gráfica */}
      <div className="chart-container">
        {loading ? (
          <div className="loading">Cargando datos...</div>
        ) : (
          <Line data={chartData()} options={chartOptions} />
        )}
      </div>
    </div>
  );
}
