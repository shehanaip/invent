import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import AppSelect from "../components/AppSelect";
import Pagination from "../components/Pagination";
import { usePreferences } from "../context/usePreferences";
import { translate } from "../utils/translations";
import usePagination from "../utils/usePagination";

export default function Suppliers({ dark, setDark }) {
  const { settings } = usePreferences();
  const t = (text) => translate(text, settings.language);
  const [menuOpen, setMenuOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const supplierPagination = usePagination(suppliers);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    status: "Active",
  });

  const token = localStorage.getItem("token");

  // FETCH
  const fetchSuppliers = async () => {
    try {
      const res = await API.get("/suppliers", {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      setSuppliers(res.data || []);
    } catch (err) {
      console.log(err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // HANDLE INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  // ADD
  const addSupplier = async () => {
    try {
      await API.post("/suppliers", form, {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      resetForm();
      fetchSuppliers();
    } catch (err) {
      console.log(err);
    }
  };

  // DELETE
  const deleteSupplier = async (id) => {
    try {
      await API.delete(`/suppliers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      fetchSuppliers();
    } catch (err) {
      console.log(err);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      status: "Active",
    });

    setShowModal(false);
  };

  const activeSuppliers = suppliers.filter(
    (s) => s.status === "Active"
  ).length;

  if (loading) {
    return (
      <div className={`loader-screen ${dark ? "dark" : "light"}`}>
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>{t("Suppliers")}</h1>
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
        active="suppliers"
      />

      {/* MAIN */}
      <main className="main-content suppliers-page modern-data-page">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-truck"></i> {t("Suppliers")}
          </h1>

          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus"></i> {t("Add Supplier")}
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card modern-stat-card">
            <span className="modern-stat-icon"><i className="fas fa-building" aria-hidden="true"></i></span>
            <h2>{suppliers.length}</h2>
            <p>{t("Total Suppliers")}</p>
          </div>

          <div className="stat-card modern-stat-card active-stat">
            <span className="modern-stat-icon"><i className="fas fa-circle-check" aria-hidden="true"></i></span>
            <h2>{activeSuppliers}</h2>
            <p>{t("Active")}</p>
          </div>

        </div>

        {/* TABLE */}
        <div className="table-card responsive-card-table">
          <div className="modern-table-heading">
            <div>
              <h3>{t("Supplier Management")}</h3>
              <p>{t("Keep supplier contacts and status in one place.")}</p>
            </div>
            <span className="modern-table-count">{suppliers.length}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>{t("Name")}</th>
                <th>{t("Company")}</th>
                <th>{t("Email")}</th>
                <th>{t("Phone")}</th>
                <th>{t("Status")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="modern-empty-cell">{t("No suppliers found")}</td>
                </tr>
              ) : (
                supplierPagination.pageItems.map((s) => (
                  <tr key={s._id}>
                    <td className="supplier-name-cell" data-label={t("Name")}>
                      <span className="customer-avatar" aria-hidden="true">
                        {(s.name || "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <strong>{s.name}</strong>
                    </td>
                    <td data-label={t("Company")}>{s.company || "-"}</td>
                    <td data-label={t("Email")}>{s.email || "-"}</td>
                    <td data-label={t("Phone")}>{s.phone || "-"}</td>

                    <td data-label={t("Status")}>
                      <span className={`modern-status-pill ${s.status === "Active" ? "positive" : "negative"}`}>
                        {t(s.status)}
                      </span>
                    </td>

                    <td className="supplier-actions-cell" data-label={t("Actions")}>
                      <button
                        className="delete-btn"
                        onClick={() => deleteSupplier(s._id)}
                      >
                        {t("Delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={suppliers.length}
            page={supplierPagination.page}
            pageCount={supplierPagination.pageCount}
            pageSize={supplierPagination.pageSize}
            onPageChange={supplierPagination.setPage}
            t={t}
          />
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large">

              <h2>{t("Add Supplier")}</h2>

              <input
                name="name"
                placeholder={t("Supplier Name")}
                value={form.name}
                onChange={handleChange}
              />

              <input
                name="company"
                placeholder={t("Company")}
                value={form.company}
                onChange={handleChange}
              />

              <input
                name="email"
                placeholder={t("Email")}
                value={form.email}
                onChange={handleChange}
              />

              <input
                name="phone"
                placeholder={t("Phone")}
                value={form.phone}
                onChange={handleChange}
              />

              <textarea
                name="address"
                placeholder={t("Address")}
                value={form.address}
                onChange={handleChange}
              />

              <AppSelect
                name="status"
                value={form.status}
                onChange={handleChange}
                ariaLabel={t("Status")}
              >
                <option>Active</option>
                <option>Inactive</option>
              </AppSelect>

              <div className="modal-actions">
                <button
                  className="save-btn"
                  onClick={addSupplier}
                >
                  {t("Save")}
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