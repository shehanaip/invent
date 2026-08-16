import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Suppliers from "./pages/Suppliers";
import Settings from "./pages/Settings";
import Logistics from "./pages/Logistics";
import Reports from "./pages/Reports";
import CashFlow from "./pages/CashFlow";
import Customers from "./pages/Customers";
import Tracking from "./pages/Tracking";
import LiveStoreTracking from "./pages/LiveStoreTracking";
import Stores from "./pages/Stores";
import Billing from "./pages/Billing";
import InventIQChat from "./components/InventIQChat";

// ================= PRIVATE ROUTE =================
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const [dark, setDark] = useState(true);
  const navigate = useNavigate();

  // Re-read on each render so chat appears after login
  const isLoggedIn = !!localStorage.getItem("token");

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <>
      <Routes>
        {/* AUTH */}
        <Route path="/auth" element={<Auth />} />

        {/* DASHBOARD */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* PRODUCTS */}
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <Products dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* ORDERS */}
        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <Orders dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* SUPPLIERS */}
        <Route
          path="/suppliers"
          element={
            <PrivateRoute>
              <Suppliers dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* SETTINGS */}
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* LOGISTICS */}
        <Route
          path="/logistics"
          element={
            <PrivateRoute>
              <Logistics dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* REPORTS */}
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Reports dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* CASHFLOW */}
        <Route
          path="/cashflow"
          element={
            <PrivateRoute>
              <CashFlow dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* CUSTOMERS */}
        <Route
          path="/customers"
          element={
            <PrivateRoute>
              <Customers dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* TRACKING */}
        <Route
          path="/tracking"
          element={
            <PrivateRoute>
              <Tracking dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* LIVE STORE TRACKING */}
        <Route
          path="/live-store-tracking"
          element={
            <PrivateRoute>
              <LiveStoreTracking
                dark={dark}
                setDark={setDark}
                logout={logout}
              />
            </PrivateRoute>
          }
        />

        {/* STORES */}
        <Route
          path="/stores"
          element={
            <PrivateRoute>
              <Stores dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* BILLING */}
        <Route
          path="/billing"
          element={
            <PrivateRoute>
              <Billing dark={dark} setDark={setDark} logout={logout} />
            </PrivateRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating InventIQ chat — only when logged in */}
      {isLoggedIn && <InventIQChat dark={dark} />}
    </>
  );
}
