import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import { isLoggedIn } from "@/lib/authService";
import "./App.css";

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({
  element,
}) => {
  return isLoggedIn() ? <>{element}</> : <Navigate to="/auth" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute element={<Home />} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
