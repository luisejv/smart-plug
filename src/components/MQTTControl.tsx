import { useState, useEffect } from "react";
import mqttService from "../services/mqtt";
import type { LastCommand } from "../types";
import "./MQTTControl.css";

type CommandType = "turnOn" | "turnOff" | "timer" | "schedule";

export default function MQTTControl() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(30);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [lastCommand, setLastCommand] = useState<LastCommand | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Intentar conectar al montar el componente
    connectToMQTT();

    return () => {
      // Desconectar al desmontar
      mqttService.disconnect();
    };
  }, []);

  const connectToMQTT = async (): Promise<void> => {
    setConnecting(true);
    setError(null);
    try {
      await mqttService.connect();
      setIsConnected(true);
    } catch (err) {
      setError(
        "No se pudo conectar al broker MQTT. Verifica la configuración."
      );
      setIsConnected(false);
      console.error("Error de conexión:", err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectFromMQTT = (): void => {
    mqttService.disconnect();
    setIsConnected(false);
  };

  const handleCommand = async (
    commandType: CommandType,
    params: Record<string, unknown> = {}
  ): Promise<void> => {
    setError(null);
    try {
      switch (commandType) {
        case "turnOn":
          await mqttService.turnOn();
          break;
        case "turnOff":
          await mqttService.turnOff();
          break;
        case "timer":
          if (timerMinutes <= 0) {
            setError("El tiempo del timer debe ser mayor a 0");
            return;
          }
          await mqttService.setTimer(timerMinutes);
          break;
        case "schedule":
          if (!scheduleDate || !scheduleTime) {
            setError("Debes seleccionar fecha y hora para programar");
            return;
          }
          const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
          if (scheduledDateTime <= new Date()) {
            setError("La fecha y hora programada debe ser futura");
            return;
          }
          await mqttService.setSchedule(scheduledDateTime);
          break;
        default:
          throw new Error("Comando no válido");
      }

      setLastCommand({
        type: commandType,
        timestamp: new Date(),
        params,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(`Error enviando comando: ${errorMessage}`);
      console.error("Error:", err);
    }
  };

  return (
    <div className="mqtt-control">
      {/* Estado de conexión */}
      <div className="connection-status">
        <div
          className={`status-indicator ${
            isConnected ? "connected" : "disconnected"
          }`}
        >
          <span className="status-dot"></span>
          <span className="status-text">
            {connecting
              ? "Conectando..."
              : isConnected
              ? "Conectado"
              : "Desconectado"}
          </span>
        </div>
        {!isConnected && !connecting && (
          <button onClick={connectToMQTT} className="connect-button">
            Conectar
          </button>
        )}
        {isConnected && (
          <button onClick={disconnectFromMQTT} className="disconnect-button">
            Desconectar
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {lastCommand && (
        <div className="last-command">
          <div className="last-command-label">Último comando enviado:</div>
          <div className="last-command-value">
            {lastCommand.type === "turnOn" && "Encender"}
            {lastCommand.type === "turnOff" && "Apagar"}
            {lastCommand.type === "timer" && `Timer: ${timerMinutes} minutos`}
            {lastCommand.type === "schedule" &&
              `Programado: ${scheduleDate} ${scheduleTime}`}
          </div>
          <div className="last-command-time">
            {lastCommand.timestamp.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Controles básicos */}
      <div className="control-section">
        <h2 className="section-title">Controles Básicos</h2>
        <div className="control-buttons">
          <button
            className="control-button primary"
            onClick={() => handleCommand("turnOn")}
            disabled={!isConnected}
          >
            Encender
          </button>
          <button
            className="control-button secondary"
            onClick={() => handleCommand("turnOff")}
            disabled={!isConnected}
          >
            Apagar
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="control-section">
        <h2 className="section-title">Timer</h2>
        <div className="timer-controls">
          <input
            type="number"
            min="1"
            max="1440"
            value={timerMinutes}
            onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)}
            className="timer-input"
            placeholder="Minutos"
          />
          <span className="timer-label">minutos</span>
        </div>
        <button
          className="control-button primary"
          onClick={() => handleCommand("timer")}
          disabled={!isConnected || timerMinutes <= 0}
        >
          Activar Timer
        </button>
      </div>

      {/* Schedule */}
      <div className="control-section">
        <h2 className="section-title">Programar</h2>
        <div className="schedule-controls">
          <div className="schedule-input-group">
            <label className="schedule-label">Fecha</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="schedule-input"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="schedule-input-group">
            <label className="schedule-label">Hora</label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="schedule-input"
            />
          </div>
        </div>
        <button
          className="control-button primary"
          onClick={() => handleCommand("schedule")}
          disabled={!isConnected || !scheduleDate || !scheduleTime}
        >
          Programar
        </button>
      </div>
    </div>
  );
}
