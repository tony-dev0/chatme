import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/styles.css";
import App from "./App.tsx";
import { AuthContextProvider } from "./context/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
  <AuthContextProvider>
    <App />
  </AuthContextProvider>
);
