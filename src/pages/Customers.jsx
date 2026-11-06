import { useEffect, useState, useMemo } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";
import { usePreferences } from "../context/usePreferences";
import { formatCurrency } from "../utils/preferences";
import { translate } from "../utils/translations";
import usePagination from "../utils/usePagination";

export default function Customers({ dark, setDark, logout }) {
  const { settings, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const money = (amount) => formatCurrency(amount, settings, exchangeRates);
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
  const customerPagination = usePagination(filtered);

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
      <div className={`loader-screen ${dark ? "dark" : "light"}`}>
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Customers")}</h1>
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
      <main className="main-content customers-page modern-data-page">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-users"></i> {t("Customers")}
          </h1>

          <input
            className="search-input"
            placeholder={t("Search customers...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              customerPagination.setPage(1);
            }}
          />
        </div>

        {/* STATS (DYNAMIC) */}
        <div className="stats-grid">

          <div className="stat-card modern-stat-card">
            <span className="modern-stat-icon"><i className="fas fa-users" aria-hidden="true"></i></span>
            <h2>
              {stats.total}
            </h2>
            <p>{t("Total Customers")}</p>
          </div>

          <div className="stat-card modern-stat-card active-stat">
            <span className="modern-stat-icon"><i className="fas fa-user-check" aria-hidden="true"></i></span>
            <h2 style={{ color: "#22c55e" }}>{stats.active}</h2>
            <p>{t("Active")}</p>
          </div>

          <div className="stat-card modern-stat-card inactive-stat">
            <span className="modern-stat-icon"><i className="fas fa-user-xmark" aria-hidden="true"></i></span>
            <h2 style={{ color: "#ef4444" }}>{stats.inactive}</h2>
            <p>{t("Inactive")}</p>
          </div>

          <div className="stat-card modern-stat-card spend-stat">
            <span className="modern-stat-icon"><i className="fas fa-wallet" aria-hidden="true"></i></span>
            <h2 style={{ color: "#f59e0b" }}>
              {money(stats.spent)}
            </h2>
            <p>{t("Total Spent")}</p>
          </div>

        </div>

        {/* TABLE */}
        <div className="table-card">
          <h3>
            <i className="fas fa-address-book"></i> {t("Customer List")}
          </h3>

          <table>
            <thead>
              <tr>
                <th>{t("Name")}</th>
                <th>{t("Phone")}</th>
                <th>{t("Email")}</th>
                <th>{t("Status")}</th>
                <th>{t("Total Spent")}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">{t("No customers found")}</td>
                </tr>
              ) : (
                customerPagination.pageItems.map((c) => (
                  <tr key={c._id || c.id}>

                    <td className="customer-name-cell">
                      <span className="customer-avatar" aria-hidden="true">
                        {(c.name || "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <strong>{c.name}</strong>
                    </td>

                    <td>
                      <i className="fas fa-phone"></i> {c.phone || "-"}
                    </td>

                    <td>
                      <i className="fas fa-envelope"></i> {c.email || "-"}
                    </td>

                    <td>
                      <span className={`modern-status-pill ${c.status === "Active" ? "positive" : "negative"}`}>
                        <i className={`fas ${c.status === "Active" ? "fa-circle-check" : "fa-circle-xmark"}`} aria-hidden="true"></i>
                        {t(c.status === "Active" ? "Active" : "Inactive")}
                      </span>
                    </td>

                    <td>
                      <i className="fas fa-bangladeshi-taka-sign"></i>{" "}
                      {money(c.totalSpent || 0)}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={filtered.length}
            page={customerPagination.page}
            pageCount={customerPagination.pageCount}
            pageSize={customerPagination.pageSize}
            onPageChange={customerPagination.setPage}
            t={t}
          />
        </div>

      </main>
    </div>
  );
}