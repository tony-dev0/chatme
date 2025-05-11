import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import Error from "./page/error";
import Register from "./page/register";
import Login from "./page/login";
import ChatLayout from "./page/chat";
import "./assets/css/chatme.css";
import axios from "axios";

function App() {
  // axios.defaults.baseURL = "http://localhost:8000/api";
  axios.defaults.baseURL = "http://192.168.14.89:8000/api";
  axios.defaults.withCredentials = true;
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={user ? <ChatLayout /> : <Login />} />
        <Route
          path="/login"
          element={user ? <ChatLayout /> : <Login />}
        ></Route>
        <Route
          path="/register"
          element={user ? <ChatLayout /> : <Register />}
        />
        <Route path="*" element={<Error />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
