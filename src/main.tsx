import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import PrivateSnapshotView from "./PrivateSnapshotView";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {import.meta.env.MODE === "owner-private" ? (
      <PrivateSnapshotView />
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
