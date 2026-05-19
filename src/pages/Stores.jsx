import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";

export default function Stores({ dark, setDark, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    location: "",
    online: true,
  });

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
    }
  };

  useEffect(() => {
    fetchStores();
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
        todayRevenue: Math.floor(Math.random() * 50000) + 5000,
        activeOrders: Math.floor(Math.random() * 25),
        lastSale: new Date().toLocaleTimeString(),
      };

      await API.post("/stores", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShowModal(false);

      setForm({
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
      />

      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-store"></i> Store Management
          </h1>

          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            + Add Store
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <h2>{stores.length}</h2>
            <p>Total Stores</p>
          </div>

          <div className="stat-card">
            <h2>
              {stores.filter((s) => s.online).length}
            </h2>
            <p>Online Stores</p>
          </div>

          <div className="stat-card">
            <h2>৳{totalRevenue.toLocaleString()}</h2>
            <p>Total Revenue</p>
          </div>
        </div>

        {/* STORE CARDS */}
        <div className="store-grid">
          {stores.map((store) => (
            <div className="store-card" key={store._id}>
              <h3>{store.name}</h3>

              <p>{store.location}</p>

              <p>
                Status:
                <span
                  style={{
                    color: store.online
                      ? "#22c55e"
                      : "#ef4444",
                    marginLeft: "8px",
                  }}
                >
                  {store.online ? "Online" : "Offline"}
                </span>
              </p>

              <p>Revenue: ৳{store.todayRevenue}</p>
              <p>Orders: {store.activeOrders}</p>
              <p>Last Sale: {store.lastSale}</p>

              <button
                className="delete-btn"
                onClick={() => deleteStore(store._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large">
              <h2>Add New Store</h2>

              <input
                name="name"
                placeholder="Store Name"
                value={form.name}
                onChange={handleChange}
              />

              <input
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={handleChange}
              />

              <select
                name="online"
                value={form.online}
                onChange={handleChange}
              >
                <option value={true}>Online</option>
                <option value={false}>Offline</option>
              </select>

              <div className="modal-actions">
                <button
                  className="save-btn"
                  onClick={addStore}
                >
                  Save
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
            </div>
          
        )}
      </main>
    </div>
  );
}