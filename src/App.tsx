import { useState } from "react";
import ConsumptionView from "./components/ConsumptionView";
import MQTTControl from "./components/MQTTControl";
import "./App.css";

type Tab = "consumption" | "control";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("consumption");

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Energy Monitor</h1>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-button ${
            activeTab === "consumption" ? "active" : ""
          }`}
          onClick={() => setActiveTab("consumption")}
        >
          Consumo
        </button>
        <button
          className={`nav-button ${activeTab === "control" ? "active" : ""}`}
          onClick={() => setActiveTab("control")}
        >
          Control
        </button>
      </nav>

      <main className="app-main">
        {activeTab === "consumption" ? <ConsumptionView /> : <MQTTControl />}
      </main>
    </div>
  );
}

export default App;
