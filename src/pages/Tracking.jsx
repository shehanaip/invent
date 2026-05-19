import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api";

export default function Tracking({ dark, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  // ================= FETCH =================
  const fetchShipments = async () => {
    try {
      const res = await API.get("/shipments", {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      setShipments(res.data || []);
    } catch (err) {
      console.log(err);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // ================= FILTER =================
  const filtered = shipments.filter((s) =>
    (s.id || "").toLowerCase().includes(search.toLowerCase())
  );

  // ================= STATUS =================
  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return <i className="fas fa-check-circle" style={{ color: "#22c55e" }} />;
      case "In Transit":
        return <i className="fas fa-truck" style={{ color: "#f59e0b" }} />;
      default:
        return <i className="fas fa-clock" style={{ color: "#ef4444" }} />;
    }
  };

  const getStatusColor = (status) => {
    if (status === "Delivered") return "#22c55e";
    if (status === "In Transit") return "#f59e0b";
    return "#ef4444";
  };

  // ================= STATS =================
  const total = shipments.length;
  const inTransit = shipments.filter(s => s.status === "In Transit").length;
  const delivered = shipments.filter(s => s.status === "Delivered").length;

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>TRACKING</h1>
      </div>
    );
  }

  return (
    <div className={`app-container ${dark ? "dark" : "light"}`}>

      {/* Hamburger */}
      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar */}
      <Sidebar menuOpen={menuOpen} dark={dark} logout={logout} />

      {/* MAIN */}
      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-map-marker-alt"></i> Live Tracking
          </h1>

          <input
            className="search-input"
            placeholder="Search shipment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <i className="fas fa-box"></i>
            <h2>{total}</h2>
            <p>Total Shipments</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-truck"></i>
            <h2>{inTransit}</h2>
            <p>In Transit</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-check-circle"></i>
            <h2>{delivered}</h2>
            <p>Delivered</p>
          </div>
        </div>

        {/* TRACKING LIST */}
        <div className="table-card">
          <h3>
            <i className="fas fa-route"></i> Shipment Tracking
          </h3>

          <div style={{ display: "grid", gap: "18px" }}>

            {filtered.length === 0 ? (
              <p>No shipments found</p>
            ) : (
              filtered.map((s) => (
                <div
                  key={s._id || s.id}
                  style={{
                    padding: "18px",
                    borderRadius: "16px",
                    background: dark
                      ? "rgba(255,255,255,0.04)"
                      : "#fff",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    transition: "0.3s ease"
                  }}
                >

                  {/* HEADER */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px"
                    }}
                  >
                    <h4 style={{ margin: 0 }}>
                      <i className="fas fa-barcode"></i> {s.id}
                    </h4>

                    <span
                      style={{
                        color: getStatusColor(s.status),
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {getStatusIcon(s.status)} {s.status}
                    </span>
                  </div>

                  {/* INFO */}
                  <p>
                    <i className="fas fa-box"></i> {s.product}
                  </p>

                  <p>
                    <i className="fas fa-location-dot"></i> {s.location}
                  </p>

                  {/* DYNAMIC BAR */}
                  <div
                    style={{
                      height: "14px",
                      background: "#1e293b",
                      borderRadius: "30px",
                      overflow: "hidden",
                      marginTop: "15px",
                      position: "relative"
                    }}
                  >
                    <div
                      style={{
                        width: `${
  s.progress ??
  (s.status === "Delivered"
    ? 100
    : s.status === "In Transit"
    ? 65
    : 25)
}%`,
                        height: "100%",
                        background: getStatusColor(s.status),
                        borderRadius: "30px",
                        transition: "width 1.5s ease-in-out",
                        boxShadow: `0 0 15px ${getStatusColor(s.status)}`
                      }}
                    />
                  </div>

                  {/* TRACKING STEPS */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "10px",
                      fontSize: "12px",
                      opacity: 0.8
                    }}
                  >
                    <span>Ordered</span>
                    <span>Packed</span>
                    <span>Transit</span>
                    <span>Delivered</span>
                  </div>

                  <small
                    style={{
                      display: "block",
                      marginTop: "10px",
                      fontWeight: "600",
                      color: getStatusColor(s.status)
                    }}
                  >
                    Progress: {
  s.progress ??
  (s.status === "Delivered"
    ? 100
    : s.status === "In Transit"
    ? 65
    : 25)
}%
                  </small>

                </div>
              ))
            )}

          </div>
        </div>

      </main>
    </div>
  );
}