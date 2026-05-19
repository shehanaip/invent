import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import API from "../api";

export default function LiveStoreTracking({ dark, setDark, logout }) {
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
      <div className="loader-screen">
        <h1>LIVE STORE TRACKING</h1>
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

      <main className="main-content">
        <div className="topbar">
          <h1>
            <i className="fas fa-store"></i> Live Store Tracking
          </h1>
        </div>

        <div className="stats-grid">
          {stores.map((store) => (
            <div className="stat-card" key={store._id}>
              <h2>{store.name}</h2>

              <p>
                Status:{" "}
                <span
                  style={{
                    color: store.online ? "#22c55e" : "#ef4444",
                  }}
                >
                  {store.online ? "Online" : "Offline"}
                </span>
              </p>

              <p>Location: {store.location}</p>
              <p>Revenue Today: ৳{store.todayRevenue}</p>
              <p>Active Orders: {store.activeOrders}</p>
              <p>Last Sale: {store.lastSale}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}