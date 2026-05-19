import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";

export default function Suppliers({ dark, setDark }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div className="loader-screen">
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>SUPPLIERS</h1>
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
      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-truck"></i> Suppliers
          </h1>

          <button
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus"></i> Add Supplier
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card">
            <i className="fas fa-building"></i>
            <h2>{suppliers.length}</h2>
            <p>Total Suppliers</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-check-circle"></i>
            <h2>{activeSuppliers}</h2>
            <p>Active</p>
          </div>

        </div>

        {/* TABLE */}
        <div className="table-card">
          <h3>Supplier Management</h3>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6">No suppliers found</td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s._id}>
                    <td>{s.name}</td>
                    <td>{s.company}</td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>

                    <td>
                      <span
                        style={{
                          color:
                            s.status === "Active"
                              ? "#22c55e"
                              : "#ff7a00",
                        }}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => deleteSupplier(s._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large">

              <h2>Add Supplier</h2>

              <input
                name="name"
                placeholder="Supplier Name"
                value={form.name}
                onChange={handleChange}
              />

              <input
                name="company"
                placeholder="Company"
                value={form.company}
                onChange={handleChange}
              />

              <input
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
              />

              <input
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
              />

              <textarea
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
              />

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <div className="modal-actions">
                <button
                  className="save-btn"
                  onClick={addSupplier}
                >
                  Save
                </button>

                <button
                  className="cancel-btn"
                  onClick={resetForm}
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