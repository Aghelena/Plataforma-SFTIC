import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import TextReader from "./components/accessibility/TextReader";
import { SpeechProvider } from "./contexts/SpeechContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SpeechProvider>
        <App />
        <TextReader />
      </SpeechProvider>
    </BrowserRouter>
  </React.StrictMode>
);