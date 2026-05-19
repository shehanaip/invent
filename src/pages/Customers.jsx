import { useEffect, useState, useMemo } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";

export default function Customers({ dark, setDark, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  // ================= FETCH =================
  const fetchCustomers = async () => {
    try {
      const res = await API.get("/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(res.data || []);
    } catch (err) {
      console.log("FETCH ERROR:", err.response?.data || err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchCustomers();

  const handleRefresh = () => {
    fetchCustomers();
  };

  window.addEventListener("refresh-customers", handleRefresh);

  return () => {
    window.removeEventListener("refresh-customers", handleRefresh);
  };
}, []);

  // ================= FILTER (OPTIMIZED) =================
  const filtered = useMemo(() => {
    return customers.filter((c) =>
      `${c.name} ${c.phone} ${c.email}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [customers, search]);

  // ================= STATS (DYNAMIC) =================
  const stats = useMemo(() => {
    return {
      total: customers.length,
      active: customers.filter((c) => c.status === "Active").length,
      inactive: customers.filter((c) => c.status === "Inactive").length,
      spent: customers.reduce(
        (sum, c) => sum + (c.totalSpent || 0),
        0
      ),
    };
  }, [customers]);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>CUSTOMERS</h1>
      </div>
    );
  }

  return (
    <div className={`app-container ${dark ? "dark" : "light"}`}>

      {/* HAMBURGER */}
      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* SIDEBAR */}
      <Sidebar
        menuOpen={menuOpen}
        dark={dark}
        setDark={setDark}
        logout={logout}
        active="customers"
      />

      {/* MAIN */}
      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-users"></i> Customers
          </h1>

          <input
            className="search-input"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* STATS (DYNAMIC) */}
        <div className="stats-grid">

          <div className="stat-card">
            <h2>
              <i className="fas fa-user"></i> {stats.total}
            </h2>
            <p>Total Customers</p>
          </div>

          <div className="stat-card">
            <h2 style={{ color: "#22c55e" }}>
              <i className="fas fa-user-check"></i> {stats.active}
            </h2>
            <p>Active</p>
          </div>

          <div className="stat-card">
            <h2 style={{ color: "#ef4444" }}>
              <i className="fas fa-user-xmark"></i> {stats.inactive}
            </h2>
            <p>Inactive</p>
          </div>

          <div className="stat-card">
            <h2 style={{ color: "#f59e0b" }}>
              <i className="fas fa-wallet"></i>{" "}
              ৳{stats.spent.toLocaleString()}
            </h2>
            <p>Total Spent</p>
          </div>

        </div>

        {/* TABLE */}
        <div className="table-card">
          <h3>
            <i className="fas fa-address-book"></i> Customer List
          </h3>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Total Spent</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">No customers found</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id || c.id}>

                    <td>
                      <i className="fas fa-user"></i> {c.name}
                    </td>

                    <td>
                      <i className="fas fa-phone"></i> {c.phone || "-"}
                    </td>

                    <td>
                      <i className="fas fa-envelope"></i> {c.email || "-"}
                    </td>

                    <td>
                      {c.status === "Active" ? (
                        <span style={{ color: "#22c55e" }}>
                          <i className="fas fa-circle-check"></i> Active
                        </span>
                      ) : (
                        <span style={{ color: "#ef4444" }}>
                          <i className="fas fa-circle-xmark"></i> Inactive
                        </span>
                      )}
                    </td>

                    <td>
                      <i className="fas fa-bangladeshi-taka-sign"></i>{" "}
                      {Number(c.totalSpent || 0).toLocaleString()}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}