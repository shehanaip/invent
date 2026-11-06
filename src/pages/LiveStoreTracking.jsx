import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import API from "../api";
import { usePreferences } from "../context/usePreferences";
import { formatCurrency, formatTime } from "../utils/preferences";
import { translate } from "../utils/translations";

export default function LiveStoreTracking({ dark, setDark, logout }) {
  const { settings, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const money = (amount) => formatCurrency(amount, settings, exchangeRates);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchStores = async () => {
    try {
      const res = await API.get("/stores", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStores(res.data || []);
    } catch (err) {
      console.log(err);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();

    const interval = setInterval(fetchStores, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`} role="status" aria-live="polite">
        <div className="loader-bars" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Live Store Tracking")}</h1>
      </div>
    );
  }

  return (
    <div className={`app-container ${dark ? "dark" : "light"}`}>
      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <Sidebar
        menuOpen={menuOpen}
        dark={dark}
        setDark={setDark}
        logout={logout}
        active="liveStoreTracking"
      />

      <main className="main-content live-store-page modern-data-page">
        <div className="topbar">
          <h1>
            <i className="fas fa-store"></i> {t("Live Store Tracking")}
          </h1>
          <span className="live-refresh-indicator">
            <span className="status-dot"></span>
            {t("Live")}
          </span>
        </div>

        <div className="live-store-grid">
          {stores.length === 0 ? (
            <div className="modern-empty-state">
              <span className="modern-empty-icon"><i className="fas fa-shop" aria-hidden="true"></i></span>
              <strong>{t("No stores found")}</strong>
            </div>
          ) : stores.map((store) => (
            <article className="live-store-card" key={store._id}>
              <div className="live-store-card-header">
                <span className="live-store-icon"><i className="fas fa-shop" aria-hidden="true"></i></span>
                <div>
                  <h2>{store.name}</h2>
                  <p><i className="fas fa-location-dot" aria-hidden="true"></i> {store.location || "-"}</p>
                </div>
                <span className={`modern-status-pill ${store.online ? "positive" : "negative"}`}>
                  <span className="status-dot"></span>
                  {store.online ? t("Online") : t("Offline")}
                </span>
              </div>

              <div className="live-store-metrics">
                <div>
                  <span>{t("Revenue Today")}</span>
                  <strong>{money(store.todayRevenue)}</strong>
                </div>
                <div>
                  <span>{t("Active Orders")}</span>
                  <strong>{store.activeOrders ?? 0}</strong>
                </div>
              </div>

              <div className="live-store-footer">
                <span><i className="fas fa-clock" aria-hidden="true"></i> {t("Last Sale")}</span>
                <strong>{formatTime(store.lastSale, settings)}</strong>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}