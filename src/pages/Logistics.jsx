import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import Pagination from "../components/Pagination";
import { usePreferences } from "../context/usePreferences";
import { translate } from "../utils/translations";
import usePagination from "../utils/usePagination";

export default function Logistics({ dark, setDark, logout }) {
  const { settings } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    productId: "",
    status: "Pending",
    location: "",
    trackingNumber: "",
  });

  // ================= FETCH SHIPMENTS =================
  const fetchShipments = async () => {
    try {
      const res = await API.get("/shipments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShipments(res.data || []);
    } catch (err) {
      console.log(err);
      setShipments([]);
    }
  };

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const res = await API.get("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts(res.data || []);
    } catch (err) {
      console.log(err);
      setProducts([]);
    }
  };

  useEffect(() => {
    Promise.all([fetchShipments(), fetchProducts()])
      .finally(() => setLoading(false));
  }, []);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  // ================= RESET =================
  const resetForm = () => {
    setForm({
      productId: "",
      status: "Pending",
      location: "",
      trackingNumber: "",
    });

    setEditMode(false);
    setEditId(null);
    setShowModal(false);
  };

  // ================= ADD =================
  const addShipment = async () => {
    try {
      await API.post("/shipments", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      resetForm();
      fetchShipments();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= UPDATE =================
  const updateShipment = async () => {
    try {
      await API.put(`/shipments/${editId}`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      resetForm();
      fetchShipments();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= DELETE =================
  const deleteShipment = async (id) => {
    try {
      await API.delete(`/shipments/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchShipments();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= EDIT =================
  const startEdit = (shipment) => {
    setEditMode(true);
    setEditId(shipment._id);
    setShowModal(true);

    setForm({
      productId: shipment.productId?._id || "",
      status: shipment.status,
      location: shipment.location,
      trackingNumber: shipment.trackingNumber || "",
    });
  };

  // ================= FILTER =================
  const filtered = shipments.filter((s) =>
    s.productId?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const shipmentPagination = usePagination(filtered);

  // ================= STATUS COLORS =================
  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "#22c55e";
      case "In Transit":
        return "#2563eb";
      case "Pending":
        return "#f59e0b";
      case "Cancelled":
        return "#ef4444";
      default:
        return "#999";
    }
  };

  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`}>
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Logistics")}</h1>
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
        active="logistics"
      />

      <main className="main-content logistics-page modern-data-page">

        <div className="topbar">
          <h1>
            <i className="fas fa-truck"></i> {t("Logistics")}
          </h1>

          <div className="actions">
            <input
              className="search-input"
              placeholder={t("Search shipment...")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                shipmentPagination.setPage(1);
              }}
            />

            <button
              className="add-btn"
              onClick={() => setShowModal(true)}
            >
              {t("Add Shipment")}
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card modern-stat-card">
            <span className="modern-stat-icon"><i className="fas fa-boxes-stacked" aria-hidden="true"></i></span>
            <h2>{shipments.length}</h2>
            <p>{t("Total Shipments")}</p>
          </div>

          <div className="stat-card modern-stat-card delivered-stat">
            <span className="modern-stat-icon"><i className="fas fa-circle-check" aria-hidden="true"></i></span>
            <h2>
              {shipments.filter((s) => s.status === "Delivered").length}
            </h2>
            <p>{t("Delivered")}</p>
          </div>

          <div className="stat-card modern-stat-card transit-stat">
            <span className="modern-stat-icon"><i className="fas fa-truck-fast" aria-hidden="true"></i></span>
            <h2>
              {shipments.filter((s) => s.status === "In Transit").length}
            </h2>
            <p>{t("In Transit")}</p>
          </div>
        </div>

        <div className="table-card">
          <div className="modern-table-heading">
            <div>
              <h3>{t("Shipment Tracking")}</h3>
              <p>{t("Track shipment status, destination, and progress.")}</p>
            </div>
            <span className="modern-table-count">{filtered.length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>{t("Product")}</th>
                <th>{t("Status")}</th>
                <th>{t("Location")}</th>
                <th>{t("Tracking")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="modern-empty-cell">{t("No shipments found")}</td>
                </tr>
              ) : shipmentPagination.pageItems.map((s) => (
                <tr key={s._id}>
                  <td className="shipment-product-cell" data-label={t("Product")}>
                    <span className="shipment-product-content">
                      <span className="shipment-product-icon"><i className="fas fa-box" aria-hidden="true"></i></span>
                      <strong>{s.productId?.name || "-"}</strong>
                    </span>
                  </td>

                  <td data-label={t("Status")}>
                    <span className="modern-status-pill" style={{ "--status-color": getStatusColor(s.status) }}>
                      {t(s.status)}
                    </span>
                  </td>

                  <td data-label={t("Location")}>{s.location || "-"}</td>
                  <td className="tracking-id-cell" data-label={t("Tracking")}>{s.trackingNumber || "-"}</td>

                  <td className="shipment-actions-cell" data-label={t("Actions")}>
                    <button
                      className="edit-btn"
                      onClick={() => startEdit(s)}
                    >
                      {t("Edit")}
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteShipment(s._id)}
                    >
                      {t("Delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalItems={filtered.length}
            page={shipmentPagination.page}
            pageCount={shipmentPagination.pageCount}
            pageSize={shipmentPagination.pageSize}
            onPageChange={shipmentPagination.setPage}
            t={t}
          />
        </div>

        {showModal && (
          <div className="modal-overlay shipment-modal-overlay">
            <div className="modal-box large compact-form-modal" role="dialog" aria-modal="true" aria-labelledby="shipment-form-title">
              <div className="form-modal-header">
                <div>
                  <span className="form-modal-kicker">{t("Shipment Tracking")}</span>
                  <h2 id="shipment-form-title">{editMode ? `${t("Edit")} ${t("Shipment")}` : t("Add Shipment")}</h2>
                </div>
                <button type="button" className="modal-close-btn" onClick={resetForm} aria-label={t("Cancel")}>
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>

              <div className="compact-form-grid">
                <label className="compact-form-field compact-field-wide" htmlFor="shipment-product">
                  <span>{t("Product")}</span>
                  <select id="shipment-product" name="productId" value={form.productId} onChange={handleChange}>
                    <option value="">{t("Select Product")}</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                <label className="compact-form-field" htmlFor="shipment-location">
                  <span>{t("Current Location")}</span>
                  <input id="shipment-location" name="location" placeholder={t("Current Location")} value={form.location} onChange={handleChange}/>
                </label>

                <label className="compact-form-field" htmlFor="shipment-tracking">
                  <span>{t("Tracking Number")}</span>
                  <input id="shipment-tracking" name="trackingNumber" placeholder={t("Tracking Number")} value={form.trackingNumber} onChange={handleChange}/>
                </label>

                <label className="compact-form-field compact-field-wide" htmlFor="shipment-status">
                  <span>{t("Status")}</span>
                  <select id="shipment-status" name="status" value={form.status} onChange={handleChange}>
                    <option value="Pending">{t("Pending")}</option>
                    <option value="In Transit">{t("In Transit")}</option>
                    <option value="Delivered">{t("Delivered")}</option>
                    <option value="Cancelled">{t("Cancelled")}</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions compact-form-actions">
                <button
                  className="save-btn"
                  onClick={editMode ? updateShipment : addShipment}
                >
                  {editMode ? t("Update") : t("Save")}
                </button>

                <button
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  {t("Cancel")}
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}