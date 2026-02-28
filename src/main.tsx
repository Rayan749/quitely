import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initPromise } from "./i18n";

initPromise.then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
