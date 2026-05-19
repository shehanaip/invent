import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import API from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Dashboard({ dark, setDark }) {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);



  // 🪟 MODAL STATES
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [useQR, setUseQR] = useState(false);

  const token = localStorage.getItem("token");

  // FETCH PRODUCTS
const fetchProducts = async () => {
  try {
    const res = await API.get("/products");
    setProducts(res.data || []);
  } catch (err) {
    console.log(err);
    setProducts([]);
  }
};
const fetchOrders = async () => {
  try {
    const res = await API.get("/orders");
    setOrders(res.data || []);
  } catch (err) {
    console.log(err);
    setOrders([]);
  }
};


  const resetForm = () => {
    setName("");
    setStock("");
    setPrice("");
    setSku("");
    setCategory("");
    setBarcode("");
    setDescription("");
    setUseQR(false);
    setShowModal(false);
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/auth";
  };

  // 🔄 LOAD
  useEffect(() => {
    const load = async () => {
      await Promise.all([
  fetchProducts(),
  fetchOrders()
]);
      setLoading(false);
    };
    load();
  }, []);

  const lowStockCount = products.filter((p) => p.totalStock <= 5).length;
  const revenue = orders
  .filter((o) => o.status === "Completed")
  .reduce((sum, o) => sum + Number(o.total || 0), 0);

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h1>INVENT</h1>
      </div>
    );
  }

  return (
    <div className={`app-container ${dark ? "dark" : "light"}`}>

      {/* 🍔 HAMBURGER */}
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
  logout={logout}
/>

      {/* MAIN */}
      <main className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <h1>
            <i className="fas fa-warehouse"></i> Inventory Dashboard
          </h1>

          <div className="actions">

            <button
              className="theme-toggle"
              onClick={() => setDark(!dark)}
            >
              <i className={dark ? "fas fa-sun" : "fas fa-moon"}></i>
              &nbsp; {dark ? "Light" : "Dark"}
            </button>



          </div>
        </div>
        {/* graph */}
        {/* ================= GRAPHS ================= */}
<div className="stats-grid">

  {/* BAR CHART */}
  <div className="table-card">
    <h3>
      <i className="fas fa-chart-bar"></i> Stock Overview
    </h3>

    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={products.slice(0, 6).map((p) => ({
          name: p.name,
          stock: Number(p.totalStock || 0),
        }))}
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="stock" fill="#ff7a00" />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* PIE CHART */}
  <div className="table-card">
    <h3>
      <i className="fas fa-chart-pie"></i> Stock Distribution
    </h3>

    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={[
            {
              name: "Healthy",
              value: Math.max(
                products.length -
                products.filter((p) => p.totalStock <= 5 ).length -
                products.filter((p) => p.totalStock === 0).length,
                0
              ),
              color: "#22c55e",
            },
            {
              name: "Low Stock",
              value: products.filter((p) => p.totalStock <= 5).length,
              color: "#f59e0b",
            },
            {
              name: "Out",
              value: products.filter((p) => p.totalStock === 0).length,
              color: "#ef4444",
            },
          ]}
          dataKey="value"
          outerRadius={90}
          label
        >
          <Cell fill="#22c55e" />
          <Cell fill="#f59e0b" />
          <Cell fill="#ef4444" />
        </Pie>

        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>

</div>

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card">
            <i className="fas fa-box"></i>
            <h2>{products.length}</h2>
            <p>Products</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>{lowStockCount}</h2>
            <p>Low Stock</p>
          </div>

          <div className="stat-card">
            <i className="fas fa-dollar-sign"></i>
            <h2>৳{revenue.toLocaleString()}</h2>
            <p>Revenue</p>
          </div>

        </div>

        {/* TABLE */}
        <div className="table-card">
          <h3>
            <i className="fas fa-table"></i> Product Inventory
          </h3>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.totalStock}</td>
                  <td>
                    {p.totalStock <= 5 ? (
                      <span style={{ color: "#ff7a00" }}>
                        ⚠ Low Stock
                      </span>
                    ) : (
                      <span style={{ color: "#22c55e" }}>
                        ✔ Available
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box large">

              <h2><i className="fas fa-plus"></i> Add Product</h2>

              <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
              <input placeholder="Stock" type="number" value={stock} onChange={(e)=>setStock(e.target.value)} />
              <input placeholder="Price" type="number" value={price} onChange={(e)=>setPrice(e.target.value)} />
              <input placeholder="SKU" value={sku} onChange={(e)=>setSku(e.target.value)} />
              <input placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)} />
              <input placeholder="Barcode" value={barcode} onChange={(e)=>setBarcode(e.target.value)} />
              <textarea placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />

              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={useQR}
                  onChange={() => setUseQR(!useQR)}
                />
                Enable QR Code
              </label>

              <div className="modal-actions">
                <button className="save-btn" onClick={addProduct}>
                  Save
                </button>

                <button className="cancel-btn" onClick={resetForm}>
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