import React from "react";
import ReactDOM from "react-dom/client";
import BarberiaApp from "../barber_loyalty_system";
import "./styles.css";

const rootEl = document.getElementById("root");

if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <BarberiaApp />
    </React.StrictMode>
  );
}
