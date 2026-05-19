import { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";

export default function Logistics({ dark, setDark, logout }) {
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
      <div className="loader-screen">
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>LOGISTICS</h1>
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

      <main className="main-content">

        <div className="topbar">
          <h1>
            <i className="fas fa-truck"></i> Logistics
          </h1>

          <div className="actions">
            <input
              className="search-input"
              placeholder="Search shipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              className="add-btn"
              onClick={() => setShowModal(true)}
            >
              Add Shipment
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h2>{shipments.length}</h2>
            <p>Total Shipments</p>
          </div>

          <div className="stat-card">
            <h2>
              {shipments.filter((s) => s.status === "Delivered").length}
            </h2>
            <p>Delivered</p>
          </div>

          <div className="stat-card">
            <h2>
              {shipments.filter((s) => s.status === "In Transit").length}
            </h2>
            <p>In Transit</p>
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Location</th>
                <th>Tracking</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td>{s.productId?.name}</td>

                  <td style={{
                    color: getStatusColor(s.status),
                    fontWeight: "600",
                  }}>
                    {s.status}
                  </td>

                  <td>{s.location}</td>
                  <td>{s.trackingNumber}</td>

                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => startEdit(s)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteShipment(s._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large">

              <h2>
                {editMode ? "Edit Shipment" : "Add Shipment"}
              </h2>

              <select
                name="productId"
                value={form.productId}
                onChange={handleChange}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                name="location"
                placeholder="Current Location"
                value={form.location}
                onChange={handleChange}
              />

              <input
                name="trackingNumber"
                placeholder="Tracking Number"
                value={form.trackingNumber}
                onChange={handleChange}
              />

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option>Pending</option>
                <option>In Transit</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>

              <div className="modal-actions">
                <button
                  className="save-btn"
                  onClick={editMode ? updateShipment : addShipment}
                >
                  {editMode ? "Update" : "Save"}
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