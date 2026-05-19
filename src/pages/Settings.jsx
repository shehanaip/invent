import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Settings({ dark, setDark, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("inventSettings");

    return saved
      ? JSON.parse(saved)
      : {
          company: "INVENT Ltd",
          email: "admin@invent.com",
          currency: "BDT",
          tax: 15,
          notifications: true,
          autoBackup: true,
          lowStockAlert: true,
          language: "English",
          timezone: "Asia/Dhaka",
          password: "",
        };
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const saveSettings = () => {
    localStorage.setItem(
      "inventSettings",
      JSON.stringify(settings)
    );

    alert("Settings Saved Successfully");
  };

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

      <Sidebar
        menuOpen={menuOpen}
        dark={dark}
        logout={logout}
      />

      <main className="main-content">

        <div className="topbar">
          <h1>
            <i className="fas fa-cog"></i> Settings
          </h1>
        </div>

        <div className="settings-grid">

          {/* COMPANY */}
          <div className="settings-card">
            <h3><i className="fas fa-building"></i> Company</h3>

            <input
              name="company"
              placeholder="Company Name"
              value={settings.company}
              onChange={handleChange}
            />

            <input
              name="email"
              placeholder="Admin Email"
              value={settings.email}
              onChange={handleChange}
            />
          </div>

          {/* BILLING */}
          <div className="settings-card">
            <h3><i className="fas fa-dollar-sign"></i> Billing</h3>

            <select
              name="currency"
              value={settings.currency}
              onChange={handleChange}
            >
              <option value="BDT">BDT</option>
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>

            <input
              name="tax"
              type="number"
              placeholder="Default Tax %"
              value={settings.tax}
              onChange={handleChange}
            />
          </div>

          {/* SYSTEM */}
          <div className="settings-card">
            <h3><i className="fas fa-globe"></i> System</h3>

            <select
              name="language"
              value={settings.language}
              onChange={handleChange}
            >
              <option>English</option>
              <option>বাংলা</option>
              <option>Hindi</option>
            </select>

            <select
              name="timezone"
              value={settings.timezone}
              onChange={handleChange}
            >
              <option>Asia/Dhaka</option>
              <option>UTC</option>
              <option>Asia/Kolkata</option>
            </select>
          </div>

          {/* SECURITY */}
          <div className="settings-card">
            <h3><i className="fas fa-lock"></i> Security</h3>

            <input
              type="password"
              name="password"
              placeholder="New Password"
              value={settings.password}
              onChange={handleChange}
            />
          </div>

          {/* PREFERENCES */}
          <div className="settings-card">
            <h3><i className="fas fa-sliders-h"></i> Preferences</h3>

            <label className="toggle-row">
              <input
                type="checkbox"
                name="notifications"
                checked={settings.notifications}
                onChange={handleChange}
              />
              Enable Notifications
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                name="autoBackup"
                checked={settings.autoBackup}
                onChange={handleChange}
              />
              Auto Backup
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                name="lowStockAlert"
                checked={settings.lowStockAlert}
                onChange={handleChange}
              />
              Low Stock Alerts
            </label>
          </div>

          {/* APPEARANCE */}
          <div className="settings-card">
            <h3><i className="fas fa-palette"></i> Appearance</h3>

            <button
              className="theme-toggle"
              onClick={() => setDark(!dark)}
            >
              {dark ? "☀ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>

        </div> <br />

        <div className="settings-actions">
          <button
            className="save-btn"
            onClick={saveSettings}
          >
            <i className="fas fa-save"></i> Save Settings
          </button>
        </div>

      </main>
    </div>
  );
}