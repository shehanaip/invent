import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import AppSelect from "../components/AppSelect";
import { usePreferences } from "../context/usePreferences";
import { formatCurrency, formatTime } from "../utils/preferences";
import { translate } from "../utils/translations";

export default function Stores({ dark, setDark, logout }) {
  const { settings, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const money = (amount) => formatCurrency(amount, settings, exchangeRates);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    groupName: "",
    name: "",
    location: "",
    online: true,
  });

  const fetchStores = async (initialLoad = false) => {
    try {
      const res = await API.get("/stores", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStores(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      if (initialLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === "online" ? value === "true" : value,
    });
  };

  const addStore = async () => {
    try {
      const payload = {
        ...form,
        todayRevenue: 0,
        activeOrders: 0,
        lastSale: "",
      };

      await API.post("/stores", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShowModal(false);

      setForm({
        groupName: "",
        name: "",
        location: "",
        online: true,
      });

      fetchStores();
    } catch (err) {
      console.log(err);
    }
  };

  const deleteStore = async (id) => {
    try {
      await API.delete(`/stores/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchStores();
    } catch (err) {
      console.log(err);
    }
  };

  const totalRevenue = stores.reduce(
    (sum, s) => sum + (s.todayRevenue || 0),
    0
  );

  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`} role="status" aria-live="polite">
        <div className="loader-bars" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Stores")}</h1>
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
        active="stores"
      />

      <main className="main-content stores-page modern-data-page">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-store"></i> {t("Store Management")}
          </h1>

          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            + {t("Add Store")}
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card modern-stat-card">
            <span className="modern-stat-icon"><i className="fas fa-store" aria-hidden="true"></i></span>
            <h2>{stores.length}</h2>
            <p>{t("Total Stores")}</p>
          </div>

          <div className="stat-card modern-stat-card active-stat">
            <span className="modern-stat-icon"><i className="fas fa-wifi" aria-hidden="true"></i></span>
            <h2>
              {stores.filter((s) => s.online).length}
            </h2>
            <p>{t("Online Stores")}</p>
          </div>

          <div className="stat-card modern-stat-card spend-stat">
            <span className="modern-stat-icon"><i className="fas fa-sack-dollar" aria-hidden="true"></i></span>
            <h2>{money(totalRevenue)}</h2>
            <p>{t("Total Revenue")}</p>
          </div>
        </div>

        {/* STORE CARDS */}
        <div className="store-grid">
          {stores.length === 0 ? (
            <div className="modern-empty-state">
              <span className="modern-empty-icon"><i className="fas fa-shop" aria-hidden="true"></i></span>
              <strong>{t("No stores found")}</strong>
              <button className="add-btn" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus" aria-hidden="true"></i> {t("Add Store")}
              </button>
            </div>
          ) : stores.map((store) => (
            <div className="store-card" key={store._id}>
              <div className="store-card-heading">
                <span className="store-card-icon"><i className="fas fa-shop" aria-hidden="true"></i></span>
                <div>
                  {store.groupName && <small>{store.groupName}</small>}
                  <h3>{store.name}</h3>
                  <p><i className="fas fa-location-dot" aria-hidden="true"></i> {store.location}</p>
                </div>
                <span className={`modern-status-pill ${store.online ? "positive" : "negative"}`}>
                  <span className="status-dot"></span>
                  {store.online ? t("Online") : t("Offline")}
                </span>
              </div>

              <div className="store-metrics">
                <div>
                  <span>{t("Revenue")}</span>
                  <strong>{money(store.todayRevenue)}</strong>
                </div>
                <div>
                  <span>{t("Orders")}</span>
                  <strong>{store.activeOrders}</strong>
                </div>
              </div>

              <div className="store-card-footer">
                <span>{t("Last Sale")}: {formatTime(store.lastSale, settings)}</span>
                <button
                  className="delete-btn"
                  onClick={() => deleteStore(store._id)}
                >
                  {t("Delete")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay store-modal-overlay">
            <div className="modal-box large compact-form-modal" role="dialog" aria-modal="true" aria-labelledby="store-form-title">
              <div className="form-modal-header">
                <div>
                  <span className="form-modal-kicker">{t("Store Management")}</span>
                  <h2 id="store-form-title">{t("Add New Store")}</h2>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)} aria-label={t("Cancel")}>
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>

              <div className="compact-form-grid">
                <label className="compact-form-field compact-field-wide" htmlFor="store-group">
                  <span>{t("Brand / Store group")}</span>
                  <input id="store-group" name="groupName" placeholder={t("e.g. Northstar Market")} value={form.groupName} onChange={handleChange}/>
                </label>

                <label className="compact-form-field compact-field-wide" htmlFor="store-name">
                  <span>{t("Branch name")}</span>
                  <input id="store-name" name="name" placeholder={t("Store Name")} value={form.name} onChange={handleChange}/>
                </label>

                <label className="compact-form-field compact-field-wide" htmlFor="store-location">
                  <span>{t("Location")}</span>
                  <input id="store-location" name="location" placeholder={t("Location")} value={form.location} onChange={handleChange}/>
                </label>

                <label className="compact-form-field compact-field-wide" htmlFor="store-status">
                  <span>{t("Status")}</span>
                  <AppSelect id="store-status" name="online" value={form.online} onChange={handleChange}>
                    <option value={true}>{t("Online")}</option>
                    <option value={false}>{t("Offline")}</option>
                  </AppSelect>
                </label>
              </div>

              <div className="modal-actions compact-form-actions">
                <button
                  className="save-btn"
                  onClick={addStore}
                >
                  {t("Save")}
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  {t("Cancel")}
                </button>
              </div>
          </div>
            </div>
          
        )}
      </main>
    </div>
  );
}