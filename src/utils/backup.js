import API from "../api";

export const AUTO_BACKUP_TIMESTAMP_KEY = "inventLastAutoBackupAt";
export const AUTO_BACKUP_RETRY_KEY = "inventAutoBackupRetryAt";
export const AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000;

const backupResources = [
  ["products", "/products"],
  ["orders", "/orders"],
  ["suppliers", "/suppliers"],
  ["shipments", "/shipments"],
  ["cashFlow", "/cashflow"],
  ["customers", "/customers"],
  ["stores", "/stores"],
  ["payments", "/payments"],
];

export async function downloadAppBackup() {
  const entries = await Promise.all(
    backupResources.map(async ([name, endpoint]) => {
      const response = await API.get(endpoint);
      return [name, response.data];
    })
  );
  const data = Object.fromEntries(entries);
  const recordCount = entries.reduce(
    (total, [, records]) => total + (Array.isArray(records) ? records.length : 0),
    0
  );
  let settings = {};
  try {
    const savedSettings = JSON.parse(localStorage.getItem("inventSettings") || "{}");
    if (savedSettings && typeof savedSettings === "object" && !Array.isArray(savedSettings)) {
      settings = { ...savedSettings };
    }
  } catch (error) {
    console.error("Could not read settings for the backup:", error);
  }
  delete settings.password;
  const backup = {
    application: "INVENT",
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    settings,
    data,
  };
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const filename = `invent-backup-${date}.json`;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { filename, recordCount };
}
