import { useEffect, useMemo, useState } from "react";
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
import PreferencesProvider from "./context/PreferencesProvider";
import API from "./api";
import {
  AUTO_BACKUP_INTERVAL,
  AUTO_BACKUP_RETRY_KEY,
  AUTO_BACKUP_TIMESTAMP_KEY,
  downloadAppBackup,
} from "./utils/backup";
import {
  DEFAULT_SETTINGS,
  getLocale,
  RATE_CACHE_KEY,
  readSettings,
} from "./utils/preferences";

// ================= PRIVATE ROUTE =================
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/auth" replace />;
}

const READY_RATE_STATE = { status: "ready", message: "" };

export default function App() {
  const [settings, setSettings] = useState(readSettings);
  const [exchangeRates, setExchangeRates] = useState({ BDT: 1 });
  const [rateRequestState, setRateRequestState] = useState({
    status: "ready",
    message: "",
  });
  const navigate = useNavigate();
  const dark = settings.theme !== "light";
  const rateState = useMemo(
    () => settings.currency === "BDT" ? READY_RATE_STATE : rateRequestState,
    [settings.currency, rateRequestState]
  );
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    document.documentElement.lang = getLocale(settings.language);
  }, [settings.language]);

  useEffect(() => {
    if (!isLoggedIn || !settings.autoBackup) return undefined;

    let active = true;
    let running = false;
    const createBackupIfDue = async () => {
      if (running) return;
      const now = Date.now();
      const lastBackup = Number(localStorage.getItem(AUTO_BACKUP_TIMESTAMP_KEY)) || 0;
      const retryAt = Number(localStorage.getItem(AUTO_BACKUP_RETRY_KEY)) || 0;
      if (now - lastBackup < AUTO_BACKUP_INTERVAL || now < retryAt) return;

      running = true;
      try {
        await downloadAppBackup();
        if (!active) return;
        localStorage.setItem(AUTO_BACKUP_TIMESTAMP_KEY, String(Date.now()));
        localStorage.removeItem(AUTO_BACKUP_RETRY_KEY);
        window.dispatchEvent(new CustomEvent("invent:backup-status", {
          detail: { status: "success" },
        }));
      } catch (error) {
        console.error("Could not create the automatic backup:", error);
        if (active) {
          localStorage.setItem(AUTO_BACKUP_RETRY_KEY, String(Date.now() + 60 * 60 * 1000));
          window.dispatchEvent(new CustomEvent("invent:backup-status", {
            detail: { status: "error" },
          }));
        }
      } finally {
        running = false;
      }
    };

    const initialCheck = window.setTimeout(createBackupIfDue, 0);
    const interval = window.setInterval(createBackupIfDue, 60 * 1000);
    return () => {
      active = false;
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
    };
  }, [isLoggedIn, settings.autoBackup]);

  useEffect(() => {
    if (!isLoggedIn || !settings.notifications || !settings.lowStockAlert) {
      return undefined;
    }

    let active = true;
    const checkLowStock = async () => {
      try {
        const response = await API.get("/products");
        if (!active || !Array.isArray(response.data)) return;

        const products = response.data;
        const lowStockProducts = products.filter((product) => Number(product.totalStock) <= 5);
        const lowStockIds = new Set(lowStockProducts.map((product) => String(product._id)));
        let previouslyNotified = [];
        try {
          previouslyNotified = JSON.parse(localStorage.getItem("inventLowStockNotified") || "[]");
          if (!Array.isArray(previouslyNotified)) previouslyNotified = [];
        } catch (error) {
          console.error("Could not read low-stock notification history:", error);
        }
        const notifiedIds = new Set(previouslyNotified.filter((id) => lowStockIds.has(id)));

        if ("Notification" in window && Notification.permission === "granted") {
          for (const product of lowStockProducts) {
            const id = String(product._id);
            if (notifiedIds.has(id)) continue;
            const notification = new Notification(
              settings.language === "বাংলা" ? "কম স্টকের সতর্কতা" :
                settings.language === "Hindi" ? "कम स्टॉक अलर्ट" : "Low stock alert",
              {
                body: `${product.name}: ${product.totalStock}`,
                tag: `low-stock-${id}`,
              }
            );
            notification.onclick = () => {
              window.focus();
              navigate("/products");
              notification.close();
            };
            notifiedIds.add(id);
          }
        }

        localStorage.setItem("inventLowStockNotified", JSON.stringify([...notifiedIds]));
      } catch (error) {
        console.error("Could not check low-stock products:", error);
      }
    };

    const initialCheck = window.setTimeout(checkLowStock, 0);
    const interval = window.setInterval(checkLowStock, 60 * 1000);
    return () => {
      active = false;
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
    };
  }, [isLoggedIn, navigate, settings.language, settings.lowStockAlert, settings.notifications]);

  useEffect(() => {
    const currency = settings.currency || DEFAULT_SETTINGS.currency;
    if (currency === "BDT") {
      return undefined;
    }

    let active = true;
    const controller = new AbortController();
    const readCachedRates = () => {
      try {
        return JSON.parse(localStorage.getItem(RATE_CACHE_KEY) || "null");
      } catch (error) {
        console.error("Could not read cached exchange rates:", error);
        return null;
      }
    };

    const loadRates = async () => {
      await Promise.resolve();
      const cached = readCachedRates();
      const cacheIsValid =
        cached?.base === "BDT" &&
        Number.isFinite(cached?.rates?.[currency]) &&
        cached.rates[currency] > 0;
      const cacheIsFresh =
        cacheIsValid && Date.now() - cached.updatedAt < 12 * 60 * 60 * 1000;

      if (cacheIsFresh) {
        setExchangeRates(cached.rates);
        setRateRequestState({ status: "ready", message: "" });
        return;
      }

      setRateRequestState({ status: "loading", message: "" });
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/BDT", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Exchange-rate service returned ${response.status}`);
        }

        const data = await response.json();
        const targetRate = Number(data?.rates?.[currency]);
        if (data?.result !== "success" || data.base_code !== "BDT" ||
              !Number.isFinite(targetRate) || targetRate <= 0) {
          throw new Error("Exchange-rate service returned invalid rate data");
        }

        const nextCache = {
          base: "BDT",
          rates: data.rates,
          updatedAt: Date.now(),
        };
        localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(nextCache));
        if (active) {
          setExchangeRates(data.rates);
          setRateRequestState({ status: "ready", message: "" });
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Could not load exchange rates:", error);
        if (active && cacheIsValid) {
          setExchangeRates(cached.rates);
          setRateRequestState({
            status: "stale",
            message: "Using saved exchange rates; live rates could not be refreshed.",
          });
        } else if (active) {
          setRateRequestState({
            status: "error",
            message: "Exchange rates are unavailable. BDT values cannot be converted right now.",
          });
        }
      }
    };

    loadRates();
    return () => {
      active = false;
      controller.abort();
    };
  }, [settings.currency]);

  const setDark = (nextDark) => {
    setSettings((current) => {
      const next = { ...current, theme: nextDark ? "dark" : "light" };
      localStorage.setItem("inventSettings", JSON.stringify(next));
      return next;
    });
  };

  const preferences = useMemo(
    () => ({ settings, setSettings, exchangeRates, rateState }),
    [settings, exchangeRates, rateState]
  );

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <PreferencesProvider value={preferences}>
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
    </PreferencesProvider>
  );
}
