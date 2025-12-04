import { useState, useEffect } from "react";
import mqttService from "../services/mqtt";
import type { LastCommand, ScheduleAction } from "../types";
import "./MQTTControl.css";

type CommandType = "turnOn" | "turnOff" | "timer" | "schedule";

export default function MQTTControl() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [scheduleAction, setScheduleAction] = useState<ScheduleAction>("off");
  const [lastCommand, setLastCommand] = useState<LastCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [relayOn, setRelayOn] = useState<boolean | null>(null);
  const [thresholdCutEnabled, setThresholdCutEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    // Intentar conectar al montar el componente
    connectToMQTT();

    return () => {
      // Desconectar al desmontar
      mqttService.disconnect();
    };
  }, []);

  // Suscribirse a las mediciones para conocer el estado del relé
  useEffect(() => {
    const unsubscribe = mqttService.onMeasurement((m) => {
      setRelayOn(!!m.relay);
      if (typeof m.threshold_cut_enabled !== "undefined") {
        setThresholdCutEnabled(!!m.threshold_cut_enabled);
      }
    });
    // Inicializa con la última medición si ya existe
    const last = mqttService.getLastMeasurement?.();
    if (last) {
      setRelayOn(!!last.relay);
      if (typeof last.threshold_cut_enabled !== "undefined") {
        setThresholdCutEnabled(!!last.threshold_cut_enabled);
      }
    }
    return () => {
      unsubscribe();
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
          if (timerSeconds <= 0) {
            setError("El tiempo del timer debe ser mayor a 0");
            return;
          }
          await mqttService.setTimer(timerSeconds);
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
          await mqttService.setSchedule(scheduledDateTime, scheduleAction);
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

      {/* Protección de corte por threshold */}
      <div className="control-section">
        <h2 className="section-title">Protección por Threshold</h2>
        <div
          className={`status-indicator ${
            thresholdCutEnabled ? "connected" : "disconnected"
          }`}
        >
          <span className="status-dot"></span>
          <span className="status-text">
            {thresholdCutEnabled === null
              ? "Sin datos"
              : thresholdCutEnabled
              ? "Corte por threshold: Activado"
              : "Corte por threshold: Desactivado"}
          </span>
        </div>
        <div className="control-buttons" style={{ marginTop: "0.75rem" }}>
          <button
            className="control-button primary"
            onClick={() => mqttService.setThresholdCutEnabled(true)}
            disabled={!isConnected}
          >
            Activar corte por threshold
          </button>
          <button
            className="control-button secondary"
            onClick={() => mqttService.setThresholdCutEnabled(false)}
            disabled={!isConnected}
          >
            Desactivar corte por threshold
          </button>
        </div>
      </div>

      {/* Estado del Relé */}
      <div className="control-section">
        <h2 className="section-title">Estado del Relé</h2>
        <div className={`status-indicator ${relayOn ? "connected" : "disconnected"}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {relayOn === null ? "Sin datos" : relayOn ? "Encendido (conduciendo)" : "Apagado (no conduce)"}
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {lastCommand && (
        <div className="last-command">
          <div className="last-command-label">Último comando enviado:</div>
          <div className="last-command-value">
            {lastCommand.type === "turnOn" && "Encender"}
            {lastCommand.type === "turnOff" && "Apagar"}
            {lastCommand.type === "timer" && `Timer: ${timerSeconds} segundos`}
            {lastCommand.type === "schedule" &&
              `Programado: ${scheduleDate} ${scheduleTime} → ${
                scheduleAction === "on" ? "Encender" : "Apagar"
              }`}
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
            max="86400"
            value={timerSeconds}
            onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 0)}
            className="timer-input"
            placeholder="Segundos"
          />
          <span className="timer-label">segundos</span>
        </div>
        <button
          className="control-button primary"
          onClick={() => handleCommand("timer")}
          disabled={!isConnected || timerSeconds <= 0}
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
          <div className="schedule-input-group">
            <label className="schedule-label">Acción</label>
            <select
              className="schedule-input"
              value={scheduleAction}
              onChange={(e) => setScheduleAction((e.target.value as ScheduleAction) || "off")}
            >
              <option value="on">Encender</option>
              <option value="off">Apagar</option>
            </select>
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
