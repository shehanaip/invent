import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";
import API from "../api";
import { usePreferences } from "../context/usePreferences";
import { translate } from "../utils/translations";
import usePagination from "../utils/usePagination";

const TRACKING_STEPS = ["Ordered", "Packed", "Transit", "Delivered"];

function getProgress(status) {
  if (status === "Delivered") return 100;
  if (status === "In Transit") return 65;
  if (status === "Pending") return 25;
  return 0;
}

function getStatusIcon(status) {
  if (status === "Delivered") return "fa-check-circle";
  if (status === "In Transit") return "fa-truck";
  if (status === "Cancelled") return "fa-times-circle";
  return "fa-clock";
}

function getStatusColor(status) {
  if (status === "Delivered") return "#22c55e";
  if (status === "In Transit") return "#f59e0b";
  if (status === "Cancelled") return "#ef4444";
  return "var(--accent)";
}

function getStepIndex(status) {
  if (status === "Delivered") return 3;
  if (status === "In Transit") return 2;
  if (status === "Pending") return 0;
  return -1;
}

export default function Tracking({ dark, setDark, logout }) {
  const { settings } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    const fetchShipments = async () => {
      try {
        const response = await API.get("/shipments");
        if (active) setShipments(response.data || []);
      } catch (error) {
        console.error(
          "Could not load tracking shipments:",
          error.response?.data || error.message
        );
        if (active) setShipments([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchShipments();
    return () => {
      active = false;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = shipments.filter((shipment) =>
    [
      shipment.productId?.name,
      shipment.trackingNumber,
      shipment.location,
      shipment.status,
      shipment.userId?.name,
      shipment.user?.name,
    ].some((value) => String(value || "").toLowerCase().includes(query))
  );
  const pagination = usePagination(filtered);
  const inTransit = shipments.filter((shipment) => shipment.status === "In Transit").length;
  const delivered = shipments.filter((shipment) => shipment.status === "Delivered").length;

  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`}>
        <div className="loader-bars">
          <span />
          <span />
          <span />
        </div>
        <h1>{t("Live Tracking")}</h1>
      </div>
    );
  }

  return (
    <div className={`app-container ${dark ? "dark" : "light"}`}>
      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={t("Toggle navigation")}
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <Sidebar
        menuOpen={menuOpen}
        dark={dark}
        setDark={setDark}
        logout={logout}
        active="tracking"
      />

      <main className="main-content tracking-page">
        <div className="topbar tracking-topbar">
          <div className="tracking-title">
            <span className="tracking-title-icon">
              <i className="fas fa-location-dot" />
            </span>
            <div>
              <h1>{t("Live Tracking")}</h1>
              <p>{t("Monitor every shipment from dispatch to delivery.")}</p>
            </div>
          </div>

          <label className="tracking-search">
            <i className="fas fa-search" aria-hidden="true" />
            <input
              className="search-input"
              type="search"
              placeholder={t("Search shipment...")}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                pagination.setPage(1);
              }}
              aria-label={t("Search shipment...")}
            />
          </label>
        </div>

        <section className="tracking-stats" aria-label={t("Shipment summary")}>
          <div className="tracking-stat-card">
            <span className="tracking-stat-icon"><i className="fas fa-boxes-stacked" /></span>
            <div><strong>{shipments.length}</strong><span>{t("Total Shipments")}</span></div>
          </div>
          <div className="tracking-stat-card">
            <span className="tracking-stat-icon transit"><i className="fas fa-truck-fast" /></span>
            <div><strong>{inTransit}</strong><span>{t("In Transit")}</span></div>
          </div>
          <div className="tracking-stat-card">
            <span className="tracking-stat-icon delivered"><i className="fas fa-circle-check" /></span>
            <div><strong>{delivered}</strong><span>{t("Delivered")}</span></div>
          </div>
        </section>

        <section className="tracking-list-section">
          <div className="tracking-list-heading">
            <div>
              <h2><i className="fas fa-route" /> {t("Shipment Tracking")}</h2>
              <p>{t("Track shipment status, destination, and progress.")}</p>
            </div>
            <span className="tracking-count">{filtered.length} {t("shipments")}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="tracking-empty">
              <i className="fas fa-box-open" />
              <strong>{t("No shipments found")}</strong>
              <span>{search ? t("Try another search term.") : t("Shipments will appear here when they are created.")}</span>
            </div>
          ) : (
            <div className="tracking-cards">
              {pagination.pageItems.map((shipment) => {
                const progress = getProgress(shipment.status);
                const currentStep = getStepIndex(shipment.status);
                const status = shipment.status || "Pending";

                return (
                  <article className="tracking-card" key={shipment._id}>
                    <header className="tracking-card-header">
                      <div className="tracking-number">
                        <span className="tracking-card-icon"><i className="fas fa-barcode" /></span>
                        <div>
                          <span>{t("Tracking Number")}</span>
                          <strong>{shipment.trackingNumber || shipment._id}</strong>
                        </div>
                      </div>
                      <span className="tracking-status" style={{ "--status-color": getStatusColor(status) }}>
                        <i className={`fas ${getStatusIcon(status)}`} />
                        {t(status)}
                      </span>
                    </header>

                    <div className="tracking-details">
                      <div className="tracking-detail">
                        <i className="fas fa-box" />
                        <div><span>{t("Product")}</span><strong>{shipment.productId?.name || "Unknown Product"}</strong></div>
                      </div>
                      <div className="tracking-detail">
                        <i className="fas fa-user" />
                        <div><span>{t("Customer")}</span><strong>{shipment.userId?.name || shipment.user?.name || "Unknown User"}</strong></div>
                      </div>
                      <div className="tracking-detail">
                        <i className="fas fa-location-dot" />
                        <div><span>{t("Destination")}</span><strong>{shipment.location || t("No Location")}</strong></div>
                      </div>
                    </div>

                    <div className="tracking-progress" style={{ "--status-color": getStatusColor(status) }}>
                      <div className="tracking-progress-meta">
                        <span>{t("Shipment progress")}</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div
                        className="tracking-progress-track"
                        role="progressbar"
                        aria-label={t("Shipment progress")}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                      >
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <ol className={`tracking-steps ${status === "Cancelled" ? "cancelled" : ""}`}>
                        {TRACKING_STEPS.map((step, index) => (
                          <li
                            key={step}
                            className={index <= currentStep ? "complete" : ""}
                            aria-current={index === currentStep ? "step" : undefined}
                          >
                            <span className="tracking-step-dot">
                              {index < currentStep ? <i className="fas fa-check" /> : null}
                            </span>
                            <span>{t(step)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {filtered.length > 0 && (
            <Pagination
              totalItems={filtered.length}
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              t={t}
            />
          )}
        </section>
      </main>
    </div>
  );
}
