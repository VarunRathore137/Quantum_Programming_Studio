/**
 * App.tsx
 * Main React App component
 */

import React from "react";
import QuantumCircuitEditor from "./components/QuantumCircuitEditor";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="App">
      <QuantumCircuitEditor />
    </div>
  );
};

export default App;
