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
  convertToSoles,
} from "../services/api";
import type {
  ViewMode,
  Unit,
  DailyConsumptionData,
  MonthlyConsumptionData,
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
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [viewMode, selectedDate]);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      if (viewMode === "daily") {
        const data = await getDailyConsumption(DEVICE_ID, selectedDate);
        setDailyData(data);
      } else {
        const data = await getMonthlyConsumption(DEVICE_ID, selectedDate);
        setMonthlyData(data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
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
    } else {
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
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#999999",
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          drawBorder: false,
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
        ? total.toFixed(2)
        : convertToSoles(total).toFixed(2);
    } else {
      const total = monthlyData.reduce((sum, d) => sum + d.consumption, 0);
      return unit === "kwh"
        ? total.toFixed(2)
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

      {/* Selector de fecha */}
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

      {/* Tarjeta de resumen */}
      <div className="summary-card">
        <div className="summary-label">
          {viewMode === "daily"
            ? "Consumo Total del Día"
            : "Consumo Total del Mes"}
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
