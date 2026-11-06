import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import AppSelect from "../components/AppSelect";
import ThemeToggle from "../components/ThemeToggle";
import { usePreferences } from "../context/usePreferences";
import { formatDateTime } from "../utils/preferences";
import { translate } from "../utils/translations";
import {
  AUTO_BACKUP_TIMESTAMP_KEY,
  downloadAppBackup,
} from "../utils/backup";

export default function Settings({ dark, setDark, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [now, setNow] = useState(null);
  const [backupStatus, setBackupStatus] = useState("idle");
  const [notificationPermission, setNotificationPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "unsupported"
  );
  const { settings, setSettings, rateState, exchangeRates } = usePreferences();
  const t = (text) => translate(text, settings.language);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    const initialUpdate = window.setTimeout(() => setNow(Date.now()), 0);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(initialUpdate);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "notifications" && checked) {
      requestNotificationPermission();
    }
  };

  const requestNotificationPermission = () => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission()
        .then(setNotificationPermission)
        .catch((error) => {
          console.error("Could not request notification permission:", error);
          setNotificationPermission("denied");
        });
    } else {
      setNotificationPermission(Notification.permission);
    }
  };

  useEffect(() => {
    const handleBackupStatus = (event) => {
      setBackupStatus(event.detail?.status || "idle");
    };
    window.addEventListener("invent:backup-status", handleBackupStatus);
    return () => window.removeEventListener("invent:backup-status", handleBackupStatus);
  }, []);

  const createBackup = async () => {
    setBackupStatus("running");
    try {
      await downloadAppBackup();
      localStorage.setItem(AUTO_BACKUP_TIMESTAMP_KEY, String(Date.now()));
      setBackupStatus("success");
    } catch (error) {
      console.error("Could not create a backup:", error);
      setBackupStatus("error");
    }
  };

  const saveSettings = () => {
    const taxRate = Number(settings.tax);
    if (
      String(settings.tax).trim() === "" ||
      !Number.isFinite(taxRate) ||
      taxRate < 0 ||
      taxRate > 1000
    ) {
      alert(t("Tax rate must be between 0 and 1000."));
      return;
    }

    const savedSettings = { ...settings };
    savedSettings.tax = taxRate;
    delete savedSettings.password;
    localStorage.setItem("inventSettings", JSON.stringify(savedSettings));
    setSettings(savedSettings);
    setPassword("");
    alert(t("Settings Saved Successfully"));
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
        setDark={setDark}
        logout={logout}
      />

      <main className="main-content settings-page modern-data-page">

        <div className="topbar">
          <h1>
            <i className="fas fa-cog"></i> {t("Settings")}
          </h1>
          <p className="settings-intro">{t("Manage company, billing, system, and appearance preferences.")}</p>
        </div>

        <div className="settings-grid">

          {/* COMPANY */}
          <div className="settings-card">
            <h3><i className="fas fa-building"></i> {t("Company")}</h3>

            <input
              name="company"
              placeholder={t("Company Name")}
              value={settings.company}
              onChange={handleChange}
            />

            <input
              name="email"
              placeholder={t("Admin Email")}
              value={settings.email}
              onChange={handleChange}
            />
          </div>

          {/* BILLING */}
          <div className="settings-card">
            <h3><i className="fas fa-dollar-sign"></i> {t("Billing")}</h3>

            <AppSelect
              ariaLabel={t("Currency")}
              name="currency"
              value={settings.currency}
              onChange={handleChange}
            >
              <option value="BDT">BDT</option>
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </AppSelect>

            <input
              name="tax"
              type="number"
              placeholder={t("Default Tax %")}
              min="0"
              max="1000"
              step="0.01"
              value={settings.tax}
              onChange={handleChange}
            />
            <p className="settings-help">{t("Used to calculate tax on new product orders unless the product has its own tax rate.")}</p>
            <p className="settings-help">{t("Display amounts in the selected currency. Stored amounts remain in BDT.")}</p>
            {rateState.status !== "ready" && (
              <div className={`settings-rate-message ${rateState.status}`} role="status" aria-live="polite">
                {rateState.status === "loading" && <span className="settings-rate-spinner" aria-hidden="true"></span>}
                <span>{rateState.status === "loading" ? t("Loading exchange rates...") : t(rateState.message)}</span>
              </div>
            )}
            {settings.currency !== "BDT" && exchangeRates[settings.currency] && (
              <p className="settings-help">
                1 BDT = {new Intl.NumberFormat("en", {
                  style: "currency",
                  currency: settings.currency,
                  maximumFractionDigits: 4,
                }).format(exchangeRates[settings.currency])}
              </p>
            )}
          </div>

          {/* SYSTEM */}
          <div className="settings-card">
            <h3><i className="fas fa-globe"></i> {t("System")}</h3>

            <label htmlFor="settings-language">{t("Language")}</label>
            <AppSelect
              id="settings-language"
              name="language"
              value={settings.language}
              onChange={handleChange}
            >
              <option>English</option>
              <option>বাংলা</option>
              <option>Hindi</option>
            </AppSelect>

            <label htmlFor="settings-timezone">{t("Timezone")}</label>
            <AppSelect
              id="settings-timezone"
              name="timezone"
              value={settings.timezone}
              onChange={handleChange}
            >
              <option>Asia/Dhaka</option>
              <option>UTC</option>
              <option>Asia/Kolkata</option>
            </AppSelect>
            <p className="settings-help">{t("Current time")}: {formatDateTime(now, settings)}</p>
            <p className="settings-help">{t("This screen uses the selected timezone.")}</p>
          </div>

          {/* SECURITY */}
          <div className="settings-card">
            <h3><i className="fas fa-lock"></i> {t("Security")}</h3>

            <input
              type="password"
              name="password"
              placeholder={t("New Password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {/* PREFERENCES */}
          <div className="settings-card">
            <h3><i className="fas fa-sliders-h"></i> {t("Preferences")}</h3>

            <label className="settings-toggle-row">
              <span>{t("Enable Notifications")}</span>
              <input
                type="checkbox"
                name="notifications"
                checked={settings.notifications}
                onChange={handleChange}
              />
              <span className="settings-toggle-track" aria-hidden="true"></span>
            </label>
            {settings.notifications && (
              <>
                <p className="settings-help">
                  {notificationPermission === "granted"
                    ? t("Browser notifications are enabled. Low-stock alerts also require Low Stock Alerts.")
                    : notificationPermission === "denied"
                    ? t("Notifications are blocked by your browser. Allow them in site settings.")
                    : notificationPermission === "unsupported"
                    ? t("This browser does not support notifications.")
                    : t("Allow browser notifications when prompted to receive alerts.")}
                </p>
                {notificationPermission === "default" && (
                  <button type="button" className="backup-now-btn" onClick={requestNotificationPermission}>
                    <i className="fas fa-bell" aria-hidden="true"></i>
                    {t("Enable Browser Notifications")}
                  </button>
                )}
              </>
            )}

            <label className="settings-toggle-row">
              <span>{t("Auto Backup")}</span>
              <input
                type="checkbox"
                name="autoBackup"
                checked={settings.autoBackup}
                onChange={handleChange}
              />
              <span className="settings-toggle-track" aria-hidden="true"></span>
            </label>
            <p className="settings-help">{t("Automatic JSON backups download daily while the app is open. Uploaded image files are not included. Your browser may ask permission for automatic downloads.")}</p>
            <button type="button" className="backup-now-btn" onClick={createBackup} disabled={backupStatus === "running"}>
              <i className={`fas ${backupStatus === "running" ? "fa-spinner fa-spin" : "fa-download"}`} aria-hidden="true"></i>
              {backupStatus === "running" ? t("Creating backup...") : t("Create Backup Now")}
            </button>
            {backupStatus !== "idle" && (
              <p className={`settings-help backup-status ${backupStatus}`} role="status" aria-live="polite">
                {t(backupStatus === "success" ? "Backup downloaded." : backupStatus === "error" ? "Backup failed. Check your connection and try again." : "Automatic backup downloaded.")}
              </p>
            )}

            <label className="settings-toggle-row">
              <span>{t("Low Stock Alerts")}</span>
              <input
                type="checkbox"
                name="lowStockAlert"
                checked={settings.lowStockAlert}
                onChange={handleChange}
              />
              <span className="settings-toggle-track" aria-hidden="true"></span>
            </label>
            <p className="settings-help">{t("Notify when a product has 5 or fewer units in stock. Checks run while the app is open.")}</p>
          </div>

          {/* APPEARANCE */}
          <div className="settings-card">
            <h3><i className="fas fa-palette"></i> {t("Appearance")}</h3>

            <ThemeToggle dark={dark} setDark={setDark} t={t} />
          </div>

        </div>

        <div className="settings-actions">
          <button
            className="save-btn"
            onClick={saveSettings}
          >
            <i className="fas fa-save"></i> {t("Save Settings")}
          </button>
        </div>

      </main>
    </div>
  );
}