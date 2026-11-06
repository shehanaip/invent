import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePreferences } from "../context/usePreferences";
import { translate } from "../utils/translations";

const navigationItems = [
  { label: "Dashboard", path: "/", icon: "fa-chart-line" },
  { label: "Products", path: "/products", icon: "fa-boxes" },
  { label: "Orders", path: "/orders", icon: "fa-shopping-cart" },
  { label: "Suppliers", path: "/suppliers", icon: "fa-truck" },
  { label: "Logistics", path: "/logistics", icon: "fa-shipping-fast" },
  { label: "Reports", path: "/reports", icon: "fa-chart-bar" },
  { label: "Cash Flow", path: "/cashflow", icon: "fa-wallet" },
  { label: "Customers", path: "/customers", icon: "fa-users" },
  { label: "Tracking", path: "/tracking", icon: "fa-map-marker-alt" },
  { label: "Stores", path: "/stores", icon: "fa-store" },
  { label: "Live Store Tracking", path: "/live-store-tracking", icon: "fa-map-marked-alt" },
  { label: "Billing", path: "/billing", icon: "fa-credit-card" },
  { label: "Settings", path: "/settings", icon: "fa-cog" },
];

const SIDEBAR_STORAGE_KEY = "inventSidebarCollapsed";

export default function Sidebar({ menuOpen, logout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { settings } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
  );

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <aside className={`sidebar ${menuOpen ? "show" : ""} ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <h2 className="logo">
          <i className="fas fa-box-open" aria-hidden="true"></i>
          <span className="sidebar-label">INVENT</span>
        </h2>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={toggleCollapsed}
          aria-label={t(collapsed ? "Expand sidebar" : "Collapse sidebar")}
          title={t(collapsed ? "Expand sidebar" : "Collapse sidebar")}
          aria-expanded={!collapsed}
        >
          <i className={`fas ${collapsed ? "fa-angles-right" : "fa-angles-left"}`} aria-hidden="true"></i>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label={t("Main navigation")}>
        {navigationItems.map(({ label, path, icon }) => {
          const isActive = path === "/" ? pathname === "/" : pathname.startsWith(path);
          return (
            <button
              key={path}
              type="button"
              className={`nav-btn ${isActive ? "active" : ""}`}
              onClick={() => navigate(path)}
              aria-current={isActive ? "page" : undefined}
              title={t(label)}
            >
              <i className={`fas ${icon}`} aria-hidden="true"></i>
              <span className="sidebar-label">{t(label)}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="nav-btn logout-nav-btn" onClick={logout} title={t("Logout")}>
          <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
          <span className="sidebar-label">{t("Logout")}</span>
        </button>
      </div>
    </aside>
  );
}
