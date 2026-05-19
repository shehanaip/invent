import { useNavigate } from "react-router-dom";

export default function Sidebar({ menuOpen, dark, logout }) {
  const navigate = useNavigate();

  return (
    <aside className={`sidebar ${menuOpen ? "show" : ""}`}>
      <h2 className="logo">
        <i className="fas fa-box-open"></i> INVENT
      </h2>

      <button className="nav-btn" onClick={() => navigate("/")}>
        <i className="fas fa-chart-line"></i> Dashboard
      </button>

      <button className="nav-btn" onClick={() => navigate("/products")}>
        <i className="fas fa-boxes"></i> Products
      </button>

      <button className="nav-btn" onClick={() => navigate("/orders")}>
        <i className="fas fa-shopping-cart"></i> Orders
      </button>

      <button className="nav-btn" onClick={() => navigate("/suppliers")}>
        <i className="fas fa-truck"></i> Suppliers
      </button>

      <button className="nav-btn" onClick={() => navigate("/logistics")}>
        <i className="fas fa-shipping-fast"></i> Logistics
      </button>

      <button className="nav-btn" onClick={() => navigate("/reports")}>
        <i className="fas fa-chart-bar"></i> Reports
      </button>

      <button className="nav-btn" onClick={() => navigate("/cashflow")}>
        <i className="fas fa-wallet"></i> Cash Flow
      </button>

      <button className="nav-btn" onClick={() => navigate("/customers")}>
        <i className="fas fa-users"></i> Customers
      </button>

      <button className="nav-btn" onClick={() => navigate("/tracking")}>
        <i className="fas fa-map-marker-alt"></i> Tracking
      </button>
      <button className="nav-btn" onClick={() => navigate("/stores")}>
  <i className="fas fa-store"></i> Stores
</button>
      {/* NEW: Live Store Tracking */}
      <button
        className="nav-btn"
        onClick={() => navigate("/live-store-tracking")}
      >
        <i className="fas fa-store"></i> Live Store Tracking
      </button>
      <button
  className="nav-btn"
  onClick={() => navigate("/billing")}
>
  <i className="fas fa-credit-card"></i> Billing
</button>

      <button className="nav-btn" onClick={() => navigate("/settings")}>
        <i className="fas fa-cog"></i> Settings
      </button>

      <button className="nav-btn" onClick={logout}>
        <i className="fas fa-sign-out-alt"></i> Logout
      </button>
    </aside>
  );
}